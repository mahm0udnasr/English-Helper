import "server-only";

const API = "https://www.googleapis.com/youtube/v3";

export type YouTubeChannel = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
};

export type YouTubeVideo = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  publishedAt: string;
  durationSec: number;
};

// Skip Shorts and clips: only videos at least this long are shown.
export const MIN_VIDEO_SECONDS = 4 * 60;

type Thumbs = Record<string, { url: string } | undefined>;

function apiKey() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set in .env.local");
  return key;
}

function pickThumb(thumbnails: Thumbs | undefined) {
  return (
    thumbnails?.medium?.url ??
    thumbnails?.high?.url ??
    thumbnails?.default?.url ??
    null
  );
}

// Accepts "@handle", "handle", a youtube.com/@handle URL, or a /channel/UC… URL/ID.
export function parseChannelInput(
  input: string,
): { id: string } | { handle: string } | null {
  const value = input.trim();
  if (!value) return null;

  const idMatch = value.match(/(UC[\w-]{22})/);
  if (idMatch) return { id: idMatch[1] };

  const handleMatch = value.match(/(?:youtube\.com\/)?@([\w.-]+)/);
  if (handleMatch) return { handle: handleMatch[1] };

  if (/^[\w.-]+$/.test(value)) return { handle: value };
  return null;
}

export async function resolveChannel(
  input: string,
): Promise<YouTubeChannel | null> {
  const parsed = parseChannelInput(input);
  if (!parsed) return null;

  const params = new URLSearchParams({ part: "snippet", key: apiKey() });
  if ("id" in parsed) params.set("id", parsed.id);
  else params.set("forHandle", `@${parsed.handle}`);

  const res = await fetch(`${API}/channels?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    id: item.id,
    title: item.snippet.title,
    thumbnailUrl: pickThumb(item.snippet.thumbnails),
  };
}

export const videosTag = (channelId: string) => `yt-videos:${channelId}`;

// ISO 8601 duration ("PT1H2M3S") to seconds.
export function parseDuration(iso: string): number {
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return 0;
  const [, d, h, min, sec] = m.map((v) => Number(v ?? 0));
  return d * 86400 + h * 3600 + min * 60 + sec;
}

// Latest uploads (≥ MIN_VIDEO_SECONDS) via the channel's uploads playlist
// (UC… → UU…). Tagged with videosTag(channelId) so a sync can refresh it. Scans the last 50 uploads so Shorts don't crowd out real videos;
// costs 2 quota units per channel and is cached for an hour.
export async function getLatestVideos(
  channelId: string,
  max: number,
): Promise<YouTubeVideo[]> {
  const key = apiKey();
  const listParams = new URLSearchParams({
    part: "snippet",
    playlistId: `UU${channelId.slice(2)}`,
    maxResults: "50",
    key,
  });

  const listRes = await fetch(`${API}/playlistItems?${listParams}`, {
    next: { revalidate: 3600, tags: [videosTag(channelId)] },
  });
  if (!listRes.ok) throw new Error(`YouTube API error ${listRes.status}`);
  const list = await listRes.json();

  type Item = {
    snippet: {
      title: string;
      publishedAt: string;
      thumbnails?: Thumbs;
      resourceId: { videoId: string };
    };
  };
  const items: Item[] = (list.items ?? []).filter(
    (item: Item) => item.snippet.title !== "Private video",
  );
  if (items.length === 0) return [];

  const detailParams = new URLSearchParams({
    part: "contentDetails",
    id: items.map((i) => i.snippet.resourceId.videoId).join(","),
    key,
  });
  const detailRes = await fetch(`${API}/videos?${detailParams}`, {
    next: { revalidate: 3600, tags: [videosTag(channelId)] },
  });
  if (!detailRes.ok) throw new Error(`YouTube API error ${detailRes.status}`);
  const details = await detailRes.json();

  const durations = new Map<string, number>(
    (details.items ?? []).map(
      (v: { id: string; contentDetails: { duration: string } }) => [
        v.id,
        parseDuration(v.contentDetails.duration),
      ],
    ),
  );

  return items
    .map((item) => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      thumbnailUrl: pickThumb(item.snippet.thumbnails),
      publishedAt: item.snippet.publishedAt,
      durationSec: durations.get(item.snippet.resourceId.videoId) ?? 0,
    }))
    .filter((v) => v.durationSec >= MIN_VIDEO_SECONDS)
    .slice(0, Math.min(Math.max(max, 1), 50));
}
