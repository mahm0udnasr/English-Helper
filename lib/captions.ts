import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";

export type Cue = { start: number; end: number; text: string }; // seconds

// Supadata said no more credits this month (or a rate limit).
export class CaptionsLimitError extends Error {}

// English captions for a video, or null when it has none. Each video is
// fetched once and saved in video_captions for everyone. YouTube is asked
// directly first (free, and works from home connections); it refuses cloud
// servers like Vercel's, so then Supadata's transcript API is used, when
// SUPADATA_API_KEY is set.
export async function getEnglishCaptions(
  supabase: SupabaseClient<Database>,
  videoId: string,
): Promise<Cue[] | null> {
  const { data: saved } = await supabase
    .from("video_captions")
    .select("cues")
    .eq("video_id", videoId)
    .maybeSingle();
  if (saved) return saved.cues as Cue[] | null;

  const hasSupadata = !!process.env.SUPADATA_API_KEY;
  let source: "youtube" | "supadata" = "youtube";
  let cues = await fromYouTube(videoId).catch((e) => {
    if (!hasSupadata) throw e;
    console.warn(`YouTube captions for ${videoId}, trying Supadata:`, e);
    return undefined;
  });
  // Also ask Supadata when YouTube listed no English track: it sometimes
  // hides tracks the player still shows.
  if (!cues && hasSupadata) {
    cues = await fromSupadata(videoId);
    source = "supadata";
  }
  cues ??= null;

  // Best effort: a failed save only means the next viewer fetches it again.
  // YouTube's "none" isn't saved, so Supadata can still be tried later.
  if (cues || source === "supadata")
    await supabase
      .from("video_captions")
      .insert({ video_id: videoId, cues: cues as Json, source });
  return cues;
}

// The Data API only lets a video's owner download its captions, so this asks
// YouTube's player endpoint (as the Android app) for the caption tracks and
// reads the timed text the player itself would load.
const PLAYER_URL =
  "https://www.youtube.com/youtubei/v1/player?prettyPrint=false";
const CLIENT = {
  clientName: "ANDROID",
  clientVersion: "20.10.38",
  androidSdkVersion: 34,
  hl: "en",
};
const USER_AGENT = `com.google.android.youtube/${CLIENT.clientVersion} (Linux; U; Android 14)`;

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string };

// Uploaded captions win over auto-generated ones. null: no English track.
async function fromYouTube(videoId: string): Promise<Cue[] | null> {
  const res = await fetch(PLAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ context: { client: CLIENT }, videoId }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`YouTube player error ${res.status}`);
  const data = await res.json();
  // YouTube answers requests it doesn't trust (e.g. from cloud servers) with
  // "LOGIN_REQUIRED" and no tracks; that's a failure, not "no captions".
  const status = data.playabilityStatus?.status;
  if (status !== "OK")
    throw new Error(
      `YouTube refused the player request: ${status} ${data.playabilityStatus?.reason ?? ""}`,
    );
  const tracks: CaptionTrack[] =
    data.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

  const english = tracks.filter((t) => t.languageCode.startsWith("en"));
  const track =
    english.find((t) => t.kind !== "asr") ??
    english.find((t) => t.kind === "asr");
  if (!track) return null;

  const xml = await fetch(track.baseUrl, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!xml.ok) throw new Error(`YouTube captions error ${xml.status}`);
  return parseTimedText(await xml.text());
}

const SUPADATA_URL = "https://api.supadata.ai/v1/transcript";

// https://docs.supadata.ai: 200 with timed chunks (ms). mode=native only
// returns the video's own captions (1 credit); the default would fall back
// to AI transcription, billed per minute of video. Without lang=en it may
// answer in another language.
async function fromSupadata(videoId: string): Promise<Cue[] | null> {
  const params = new URLSearchParams({
    url: `https://www.youtube.com/watch?v=${videoId}`,
    lang: "en",
    mode: "native",
  });
  const res = await fetch(`${SUPADATA_URL}?${params}`, {
    headers: { "x-api-key": process.env.SUPADATA_API_KEY! },
    cache: "no-store",
  });
  // No captions to return.
  if (res.status === 206 || res.status === 404) return null;
  if (res.status === 429 || res.status === 402)
    throw new CaptionsLimitError(`Supadata limit reached (${res.status})`);
  if (!res.ok) throw new Error(`Supadata error ${res.status}`);
  const data: {
    lang: string;
    content: { text: string; offset: number; duration: number }[];
  } = await res.json();
  if (!data.lang?.startsWith("en")) return null;
  return data.content
    .map((c) => ({
      start: c.offset / 1000,
      end: (c.offset + c.duration) / 1000,
      text: decodeEntities(c.text).replace(/\s+/g, " ").trim(),
    }))
    .filter((c) => c.text);
}

// Parses YouTube's "format 3" timed text: <p t="ms" d="ms">text</p>, where
// auto-generated captions wrap each word in <s> tags.
function parseTimedText(xml: string): Cue[] {
  const cues: Cue[] = [];
  for (const [, attrs, body] of xml.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/g)) {
    const t = Number(attrs.match(/\bt="(\d+)"/)?.[1]);
    const d = Number(attrs.match(/\bd="(\d+)"/)?.[1] ?? 0);
    const text = decodeEntities(body.replace(/<[^>]+>/g, ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!Number.isFinite(t) || !text) continue;
    cues.push({ start: t / 1000, end: (t + d) / 1000, text });
  }
  return cues;
}

function decodeEntities(s: string) {
  return s.replace(/&(#x?[\da-f]+|amp|lt|gt|quot|apos);/gi, (_, e: string) => {
    if (e[0] === "#")
      return String.fromCodePoint(
        e[1] === "x" || e[1] === "X"
          ? parseInt(e.slice(2), 16)
          : Number(e.slice(1)),
      );
    return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[
      e.toLowerCase()
    ]!;
  });
}
