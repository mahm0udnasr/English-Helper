import type { Metadata } from "next";
import Link from "next/link";
import { FaBookOpenReader, FaHeadphones } from "react-icons/fa6";
import CategoryPicker from "@/app/components/CategoryPicker";
import { getSettings } from "@/lib/supabase/server";
import AddChannelForm from "./AddChannelForm";
import ChannelRow from "./ChannelRow";
import RecommendedChannel from "./RecommendedChannel";

export const metadata: Metadata = { title: "Channels · English Helper" };

const TABS = [
  { kind: "active", label: "Active", icon: FaBookOpenReader },
  { kind: "passive", label: "Passive", icon: FaHeadphones },
] as const;

export default async function ChannelsPage({
  searchParams,
}: PageProps<"/channels">) {
  const { kind: kindParam } = await searchParams;
  const kind = kindParam === "passive" ? "passive" : "active";

  const { supabase, user, settings } = await getSettings();
  const [
    { data: channels },
    { data: defaults },
    { data: hiddenRows },
    { data: categories },
    { data: pickedRows },
  ] = await Promise.all([
    supabase
      .from("channels")
      .select("*")
      .eq("user_id", user.id)
      .eq("kind", kind)
      .order("created_at"),
    supabase
      .from("default_channels")
      .select("id, title, thumbnail_url, youtube_channel_id, category_id")
      .eq("kind", kind)
      .order("created_at"),
    supabase
      .from("hidden_default_channels")
      .select("default_channel_id")
      .eq("user_id", user.id),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .order("name"),
    supabase
      .from("user_categories")
      .select("category_id")
      .eq("user_id", user.id),
  ]);

  const hidden = new Set(hiddenRows?.map((h) => h.default_channel_id));
  const picked = (pickedRows ?? []).map((p) => p.category_id);
  const categoryName = new Map(categories?.map((c) => [c.id, c.name]));
  // Passive defaults only apply for the categories the user picked.
  const recommended = (defaults ?? []).filter(
    (c) => kind === "active" || picked.includes(c.category_id ?? ""),
  );

  const goal =
    kind === "active" ? settings.active_goal_min : settings.passive_goal_min;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
          <p className="mt-1 text-sm text-muted">
            Daily {kind} goal: <strong>{goal} min</strong>. You can change it in
            Settings.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-surface p-1">
          {TABS.map(({ kind: k, label, icon: Icon }) => (
            <Link
              key={k}
              href={`/channels?kind=${k}`}
              className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-sm transition-colors ${
                k === kind
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Icon /> {label}
            </Link>
          ))}
        </div>
      </div>

      {kind === "passive" && !!categories?.length && (
        <section className="card mb-8">
          <h2 className="mb-1 font-semibold">Categories</h2>
          <p className="mb-4 text-sm text-muted">
            You get the recommended channels from the categories you pick.
          </p>
          <CategoryPicker categories={categories} initial={picked} />
        </section>
      )}

      {recommended.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-1 text-lg font-semibold">Recommended</h2>
          <p className="mb-4 text-sm text-muted">
            Picked for you. Switch off any you don&apos;t want on Home.
          </p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {recommended.map((c) => (
              <RecommendedChannel
                key={c.id}
                channel={c}
                hidden={hidden.has(c.id)}
                category={
                  c.category_id ? categoryName.get(c.category_id) : undefined
                }
              />
            ))}
          </ul>
        </section>
      )}

      <h2 className="mb-4 text-lg font-semibold">Your channels</h2>
      <div className="card mb-6">
        <AddChannelForm key={kind} kind={kind} />
      </div>

      {!process.env.YOUTUBE_API_KEY && (
        <p className="card mb-6 text-sm text-red-500">
          YOUTUBE_API_KEY is missing from .env.local, so channels can&apos;t be
          added or synced.
        </p>
      )}

      {channels?.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} />
          ))}
        </ul>
      ) : (
        <p className="py-12 text-center text-muted">
          You haven&apos;t added any {kind} channels yet.
        </p>
      )}
    </main>
  );
}
