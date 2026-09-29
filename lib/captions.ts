import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/database.types";
import {
  cleanText,
  fetchYouTubeCaptions,
  type Cue,
} from "@/lib/youtube-captions";

export type { Cue };

// Supadata said no more credits this month (or a rate limit).
export class CaptionsLimitError extends Error {}

// English captions for a video, or null when it has none. Each video is
// fetched once and saved in video_captions for everyone; most are saved
// ahead of time by scripts/prefetch-captions.mjs run from a home connection.
// Otherwise YouTube is asked directly (works locally, refused on Vercel),
// then Supadata's transcript API, when SUPADATA_API_KEY is set.
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
  let cues = await fetchYouTubeCaptions(videoId).catch((e) => {
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
      text: cleanText(c.text),
    }))
    .filter((c) => c.text);
}
