// Weekly refresh of every channel's name and photo from YouTube, for both
// users' own channels and the admin's default channels. Photo URLs on
// YouTube's CDN change over time, so stale ones end up as broken avatars.
// (Video lists don't need this: the app caches them for an hour.)
//
// Called by pg_cron with the x-cron-secret header (the same secret as
// send-reminders). Needs the YOUTUBE_API_KEY function secret.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const TABLES = ["channels", "default_channels"] as const;
const BATCH = 50; // channels.list accepts up to 50 ids for 1 quota unit

type Thumbs = Record<string, { url: string } | undefined>;
type Snapshot = { title: string; thumbnail_url: string | null };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

// Same preference order as pickThumb in lib/youtube.ts.
const pickThumb = (t: Thumbs | undefined) =>
  t?.medium?.url ?? t?.high?.url ?? t?.default?.url ?? null;

async function fetchChannels(ids: string[], key: string) {
  const found = new Map<string, Snapshot>();
  for (let i = 0; i < ids.length; i += BATCH) {
    const params = new URLSearchParams({
      part: "snippet",
      id: ids.slice(i, i + BATCH).join(","),
      maxResults: String(BATCH),
      key,
    });
    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?${params}`,
    );
    if (!res.ok) throw new Error(`YouTube API error ${res.status}`);
    const data = await res.json();
    for (const item of data.items ?? []) {
      found.set(item.id, {
        title: item.snippet.title,
        thumbnail_url: pickThumb(item.snippet.thumbnails),
      });
    }
  }
  return found;
}

Deno.serve(async (req) => {
  try {
    const { data: config, error: configError } =
      await supabase.rpc("push_config");
    if (configError) throw configError;
    const secret = config?.[0]?.cron_secret;
    if (!secret || req.headers.get("x-cron-secret") !== secret) {
      return json({ error: "Unauthorized" }, 401);
    }

    const key = Deno.env.get("YOUTUBE_API_KEY");
    if (!key) throw new Error("YOUTUBE_API_KEY secret is not set");

    // Current name/photo per YouTube channel id, across both tables.
    const current = new Map<string, Snapshot[]>();
    for (const table of TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select("youtube_channel_id, title, thumbnail_url");
      if (error) throw error;
      for (const row of data) {
        const list = current.get(row.youtube_channel_id) ?? [];
        list.push(row);
        current.set(row.youtube_channel_id, list);
      }
    }

    const found = await fetchChannels([...current.keys()], key);

    let updated = 0;
    const missing: string[] = [];
    for (const [id, rows] of current) {
      const fresh = found.get(id);
      // Deleted or suspended on YouTube: leave the row for an admin to remove.
      if (!fresh) {
        missing.push(id);
        continue;
      }
      const changed = rows.some(
        (r) =>
          r.title !== fresh.title || r.thumbnail_url !== fresh.thumbnail_url,
      );
      if (!changed) continue;
      for (const table of TABLES) {
        const { error } = await supabase
          .from(table)
          .update(fresh)
          .eq("youtube_channel_id", id);
        if (error) throw error;
      }
      updated++;
    }

    const summary = { checked: current.size, updated, missing };
    console.log("resync-channels", summary);
    return json(summary);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
