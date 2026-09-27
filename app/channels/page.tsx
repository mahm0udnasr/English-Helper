import type { Metadata } from "next";
import Link from "next/link";
import { FaBookOpenReader, FaHeadphones } from "react-icons/fa6";
import { getSettings } from "@/lib/supabase/server";
import AddChannelForm from "./AddChannelForm";
import ChannelRow from "./ChannelRow";

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
  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("user_id", user.id)
    .eq("kind", kind)
    .order("created_at");

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
          No {kind} channels yet. Add one above.
        </p>
      )}
    </main>
  );
}
