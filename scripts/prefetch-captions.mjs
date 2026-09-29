// Saves English subtitles for the latest videos of every channel in the app
// (recommended ones and the ones users added) into video_captions, so the
// app on Vercel finds them already there. YouTube refuses caption requests
// from cloud servers but not from home connections, so run this on your own
// computer, e.g. every few hours. Videos already saved are skipped.
//
// Run with: npm run prefetch-captions
// Needs in .env.local: NEXT_PUBLIC_SUPABASE_URL, YOUTUBE_API_KEY, and
// SUPABASE_SECRET_KEY (Supabase dashboard → Project Settings → API Keys →
// Secret key). The secret key bypasses row-level security: keep it on this
// computer only, never in Vercel or git.
import { createClient } from "@supabase/supabase-js";
import { fetchYouTubeCaptions } from "../lib/youtube-captions.ts";

const VIDEOS_PER_CHANNEL = 50; // the app picks from the latest 50 uploads
// Stay gentle with YouTube: this runs from your home connection, and too many
// requests get it rate-limited (429) for a while. The first run's backlog is
// spread over several runs.
const DELAY_MS = 3000; // between videos
const MAX_PER_RUN = 150;

const env = (name) => {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in .env.local`);
    process.exit(1);
  }
  return value;
};

const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false } },
);
const youtubeKey = env("YOUTUBE_API_KEY");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function must(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

// Latest upload IDs via the channel's uploads playlist (UC… → UU…); costs 1
// unit of the YouTube API quota.
async function latestVideoIds(channelId) {
  const params = new URLSearchParams({
    part: "contentDetails",
    playlistId: `UU${channelId.slice(2)}`,
    maxResults: String(VIDEOS_PER_CHANNEL),
    key: youtubeKey,
  });
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?${params}`,
  );
  if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((i) => i.contentDetails.videoId);
}

const channelIds = [
  ...new Set(
    [
      ...(await must(
        supabase.from("default_channels").select("youtube_channel_id"),
      )),
      ...(await must(supabase.from("channels").select("youtube_channel_id"))),
    ].map((c) => c.youtube_channel_id),
  ),
];

const videoIds = [];
for (const id of channelIds) {
  try {
    videoIds.push(...(await latestVideoIds(id)));
  } catch (e) {
    console.warn(`Skipping channel ${id}: ${e.message}`);
  }
}

const saved = new Set();
for (let i = 0; i < videoIds.length; i += 100) {
  const rows = await must(
    supabase
      .from("video_captions")
      .select("video_id")
      .in("video_id", videoIds.slice(i, i + 100)),
  );
  rows.forEach((r) => saved.add(r.video_id));
}
const missing = [...new Set(videoIds)].filter((id) => !saved.has(id));
const todo = missing.slice(0, MAX_PER_RUN);
console.log(
  `${channelIds.length} channels, ${videoIds.length} videos, ${missing.length} not saved yet; fetching ${todo.length} now.`,
);

let added = 0;
let none = 0;
for (const [i, videoId] of todo.entries()) {
  if (i > 0) await sleep(DELAY_MS);
  let cues;
  try {
    cues = await fetchYouTubeCaptions(videoId);
  } catch (e) {
    console.error(`${videoId}: ${e.message}`);
    // YouTube is refusing or rate-limiting this connection; later requests
    // would fail too and only prolong it. The next run picks up from here.
    if (/LOGIN_REQUIRED|\b429\b/.test(e.message)) {
      console.error("YouTube is limiting requests; stopping. Try again later.");
      break;
    }
    continue;
  }
  // "No English captions" isn't saved: YouTube sometimes hides tracks, and
  // the app then asks Supadata once when someone opens the video.
  if (!cues) {
    none++;
    continue;
  }
  const { error } = await supabase
    .from("video_captions")
    .insert({ video_id: videoId, cues, source: "youtube" });
  if (error) console.error(`${videoId}: couldn't save: ${error.message}`);
  else added++;
  if ((i + 1) % 25 === 0) console.log(`…${i + 1}/${todo.length}`);
}

console.log(`Saved ${added} new, ${none} without English subtitles.`);
