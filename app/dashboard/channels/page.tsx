import type { Metadata } from "next";
import Link from "next/link";
import { FaBookOpenReader, FaHeadphones } from "react-icons/fa6";
import ChannelAvatar from "@/app/components/ChannelAvatar";
import type { Tables } from "@/lib/database.types";
import { requireAdmin } from "@/lib/supabase/server";
import AddDefaultChannelForm from "./AddDefaultChannelForm";
import DefaultChannelActions from "./DefaultChannelActions";
import ImportChannelsButton from "./ImportChannelsButton";

export const metadata: Metadata = {
  title: "Default channels · English Helper",
};

const TABS = [
  { kind: "active", label: "Active", icon: FaBookOpenReader },
  { kind: "passive", label: "Passive", icon: FaHeadphones },
] as const;

function ChannelList({ channels }: { channels: Tables<"default_channels">[] }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {channels.map((c) => (
        <li key={c.id} className="card flex items-center gap-4 p-4">
          <ChannelAvatar
            key={c.thumbnail_url}
            src={c.thumbnail_url}
            title={c.title}
          />
          <a
            href={`https://www.youtube.com/channel/${c.youtube_channel_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="line-clamp-1 min-w-0 flex-1 font-semibold hover:underline"
          >
            {c.title}
          </a>
          <DefaultChannelActions id={c.id} title={c.title} />
        </li>
      ))}
    </ul>
  );
}

export default async function DefaultChannelsPage({
  searchParams,
}: PageProps<"/dashboard/channels">) {
  const { kind: kindParam } = await searchParams;
  const kind = kindParam === "passive" ? "passive" : "active";

  const { supabase } = await requireAdmin();
  const [{ data: channels }, { data: categories }] = await Promise.all([
    supabase
      .from("default_channels")
      .select("*")
      .eq("kind", kind)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .order("name"),
  ]);

  const needsCategory = kind === "passive" && !categories?.length;

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
          <p className="mt-1 text-sm text-muted">
            {kind === "active"
              ? "Every user gets these; they can hide ones they don't want."
              : "Users get the channels in the categories they pick."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {kind === "passive" && <ImportChannelsButton />}
          <div className="flex rounded-lg border border-border bg-surface p-1">
            {TABS.map(({ kind: k, label, icon: Icon }) => (
              <Link
                key={k}
                href={`/dashboard/channels?kind=${k}`}
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
      </div>

      <div className="card mb-6">
        {needsCategory ? (
          <p className="text-sm text-muted">
            Passive channels need a category.{" "}
            <Link
              href="/dashboard/categories"
              className="text-accent hover:underline"
            >
              Add a category first
            </Link>
            , or import channels and categories from a spreadsheet.
          </p>
        ) : (
          <AddDefaultChannelForm
            key={kind}
            kind={kind}
            categories={categories ?? []}
          />
        )}
      </div>

      {!channels?.length ? (
        <p className="py-12 text-center text-muted">
          No default {kind} channels yet.
        </p>
      ) : kind === "active" ? (
        <ChannelList channels={channels} />
      ) : (
        <div className="flex flex-col gap-8">
          {(categories ?? []).map((category) => {
            const inCategory = channels.filter(
              (c) => c.category_id === category.id,
            );
            return (
              <section key={category.id}>
                <h2 className="mb-3 text-sm font-medium text-muted">
                  {category.name}{" "}
                  <span className="font-normal">({inCategory.length})</span>
                </h2>
                {inCategory.length ? (
                  <ChannelList channels={inCategory} />
                ) : (
                  <p className="text-sm text-muted">No channels yet.</p>
                )}
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
