import type { Metadata } from "next";
import Link from "next/link";
import { FaBookOpenReader, FaHeadphones } from "react-icons/fa6";
import ChannelAvatar from "@/app/components/ChannelAvatar";
import { TabLinks, TabPanel } from "@/app/components/UrlTabs";
import type { Tables } from "@/lib/database.types";
import { requireAdmin } from "@/lib/supabase/server";
import AddDefaultChannelForm from "./AddDefaultChannelForm";
import DefaultChannelActions from "./DefaultChannelActions";
import ImportChannelsButton from "./ImportChannelsButton";

export const metadata: Metadata = {
  title: "Default channels · English Helper",
};

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

type Kind = "active" | "passive";
const KINDS = ["active", "passive"] as const;

function KindPanel({
  kind,
  channels,
  categories,
}: {
  kind: Kind;
  channels: Tables<"default_channels">[];
  categories: { id: string; name: string }[];
}) {
  const needsCategory = kind === "passive" && !categories.length;

  return (
    <>
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
          <AddDefaultChannelForm kind={kind} categories={categories} />
        )}
      </div>

      {!channels.length ? (
        <p className="py-12 text-center text-muted">
          No default {kind} channels yet.
        </p>
      ) : kind === "active" ? (
        <ChannelList channels={channels} />
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((category) => {
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
    </>
  );
}

// Both tabs are rendered up front so switching doesn't hit the server.
export default async function DefaultChannelsPage() {
  const { supabase } = await requireAdmin();
  const [{ data: channels }, { data: categories }] = await Promise.all([
    supabase.from("default_channels").select("*").order("created_at"),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .order("name"),
  ]);

  return (
    <main>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
          <TabPanel param="kind" value="active" values={KINDS}>
            <p className="mt-1 text-sm text-muted">
              Every user gets these; they can hide ones they don&apos;t want.
            </p>
          </TabPanel>
          <TabPanel param="kind" value="passive" values={KINDS}>
            <p className="mt-1 text-sm text-muted">
              Users get the channels in the categories they pick.
            </p>
          </TabPanel>
        </div>
        <div className="flex items-center gap-2">
          <TabPanel param="kind" value="passive" values={KINDS}>
            <ImportChannelsButton />
          </TabPanel>
          <TabLinks
            param="kind"
            tabs={[
              { value: "active", label: "Active", icon: <FaBookOpenReader /> },
              { value: "passive", label: "Passive", icon: <FaHeadphones /> },
            ]}
          />
        </div>
      </div>

      {KINDS.map((kind) => (
        <TabPanel key={kind} param="kind" value={kind} values={KINDS}>
          <KindPanel
            kind={kind}
            channels={(channels ?? []).filter((c) => c.kind === kind)}
            categories={categories ?? []}
          />
        </TabPanel>
      ))}
    </main>
  );
}
