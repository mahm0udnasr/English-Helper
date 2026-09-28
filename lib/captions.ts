import "server-only";

export type Cue = { start: number; end: number; text: string }; // seconds

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

// English captions for a video, or null when it has none. Uploaded captions
// win over auto-generated ones.
export async function getEnglishCaptions(
  videoId: string,
): Promise<Cue[] | null> {
  const res = await fetch(PLAYER_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": USER_AGENT },
    body: JSON.stringify({ context: { client: CLIENT }, videoId }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`YouTube player error ${res.status}`);
  const data = await res.json();
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
