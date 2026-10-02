import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

type Kind = "active" | "passive";
export type WatchChannel = { youtube_channel_id: string; title: string };

// The channels whose videos a user is shown for this kind: their own, plus
// (unless they turned recommendations off) the admin's defaults they haven't
// hidden. Passive defaults only count for the categories they picked. RLS scopes channels, user_categories and
// hidden_default_channels to the signed-in user.
export async function getWatchChannels(
  supabase: SupabaseClient<Database>,
  kind: Kind,
  includeDefaults: boolean,
): Promise<WatchChannel[]> {
  const [own, visibleDefaults] = await Promise.all([
    supabase
      .from("channels")
      .select("youtube_channel_id, title")
      .eq("kind", kind),
    includeDefaults ? getVisibleDefaults(supabase, kind) : [],
  ]);

  // A channel the user added that's also a default would show up twice.
  const byId = new Map<string, WatchChannel>();
  for (const c of [...(own.data ?? []), ...visibleDefaults]) {
    if (!byId.has(c.youtube_channel_id))
      byId.set(c.youtube_channel_id, {
        youtube_channel_id: c.youtube_channel_id,
        title: c.title,
      });
  }
  return [...byId.values()];
}

async function getVisibleDefaults(
  supabase: SupabaseClient<Database>,
  kind: Kind,
) {
  const [defaults, hidden, picked] = await Promise.all([
    supabase
      .from("default_channels")
      .select("id, youtube_channel_id, title, category_id")
      .eq("kind", kind)
      .eq("enabled", true),
    supabase.from("hidden_default_channels").select("default_channel_id"),
    kind === "passive"
      ? supabase.from("user_categories").select("category_id")
      : Promise.resolve({ data: null }),
  ]);

  const hiddenIds = new Set(hidden.data?.map((h) => h.default_channel_id));
  const pickedIds = new Set(picked.data?.map((p) => p.category_id));
  return (defaults.data ?? []).filter(
    (c) =>
      !hiddenIds.has(c.id) &&
      (kind === "active" || pickedIds.has(c.category_id ?? "")),
  );
}
