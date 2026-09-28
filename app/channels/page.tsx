import type { Metadata } from "next";
import { FaBookOpenReader, FaHeadphones } from "react-icons/fa6";
import CategoryPicker from "@/app/components/CategoryPicker";
import { TabLinks, TabPanel } from "@/app/components/UrlTabs";
import type { Tables } from "@/lib/database.types";
import { getSettings } from "@/lib/supabase/server";
import AddChannelForm from "./AddChannelForm";
import ChannelRow from "./ChannelRow";
import CollapsibleList from "./CollapsibleList";
import RecommendedChannel from "./RecommendedChannel";
import UpdateCategoriesButton from "./UpdateCategoriesButton";

export const metadata: Metadata = { title: "Channels · English Helper" };

type Kind = "active" | "passive";
const KINDS = ["active", "passive"] as const;

type DefaultChannel = Pick<
  Tables<"default_channels">,
  | "id"
  | "kind"
  | "title"
  | "thumbnail_url"
  | "youtube_channel_id"
  | "category_id"
>;

function KindPanel({
  kind,
  channels,
  recommended,
  hidden,
  categories,
  picked,
}: {
  kind: Kind;
  channels: Tables<"channels">[];
  recommended: DefaultChannel[];
  hidden: Set<string>;
  categories: { id: string; name: string }[];
  picked: string[];
}) {
  const categoryName = new Map(categories.map((c) => [c.id, c.name]));
  const canPickCategories = kind === "passive" && categories.length > 0;
  const showUpdateButton = canPickCategories && picked.length > 0;

  return (
    <>
      {/* Until categories are picked, the picker shows inline; after that it
          moves behind the "Update category" button next to Recommended. */}
      {canPickCategories && picked.length === 0 && (
        <section className="card mb-8">
          <h2 className="mb-1 font-semibold">Categories</h2>
          <p className="mb-4 text-sm text-muted">
            You get the recommended channels from the categories you pick.
          </p>
          <CategoryPicker categories={categories} initial={picked} />
        </section>
      )}

      {(recommended.length > 0 || showUpdateButton) && (
        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="mb-1 text-lg font-semibold">Recommended</h2>
              <p className="text-sm text-muted">
                Picked for you. Switch off any you don&apos;t want on Home.
              </p>
            </div>
            {showUpdateButton && (
              <UpdateCategoriesButton categories={categories} picked={picked} />
            )}
          </div>
          {recommended.length > 0 ? (
            <CollapsibleList
              items={recommended.map((c) => (
                <RecommendedChannel
                  key={c.id}
                  channel={c}
                  hidden={hidden.has(c.id)}
                  category={
                    c.category_id ? categoryName.get(c.category_id) : undefined
                  }
                />
              ))}
            />
          ) : (
            <p className="text-sm text-muted">
              No recommended channels for these categories yet.
            </p>
          )}
        </section>
      )}

      <h2 className="mb-4 text-lg font-semibold">Your channels</h2>
      <div className="card mb-6">
        <AddChannelForm kind={kind} />
      </div>

      {!process.env.YOUTUBE_API_KEY && (
        <p className="card mb-6 text-sm text-red-500">
          YOUTUBE_API_KEY is missing from .env.local, so channels can&apos;t be
          added or synced.
        </p>
      )}

      {channels.length ? (
        <CollapsibleList
          items={channels.map((channel) => (
            <ChannelRow key={channel.id} channel={channel} />
          ))}
        />
      ) : (
        <p className="py-12 text-center text-muted">
          You haven&apos;t added any {kind} channels yet.
        </p>
      )}
    </>
  );
}

// Both tabs are rendered up front so switching doesn't hit the server.
export default async function ChannelsPage() {
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
      .order("created_at"),
    supabase
      .from("default_channels")
      .select("id, kind, title, thumbnail_url, youtube_channel_id, category_id")
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
  // Passive defaults only apply for the categories the user picked.
  const recommendedFor = (kind: Kind) =>
    (defaults ?? []).filter(
      (c) =>
        c.kind === kind &&
        (kind === "active" || picked.includes(c.category_id ?? "")),
    );
  const goal = {
    active: settings.active_goal_min,
    passive: settings.passive_goal_min,
  };

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Channels</h1>
          {KINDS.map((kind) => (
            <TabPanel key={kind} param="kind" value={kind} values={KINDS}>
              <p className="mt-1 text-sm text-muted">
                Daily {kind} goal: <strong>{goal[kind]} min</strong>. You can
                change it in Settings.
              </p>
            </TabPanel>
          ))}
        </div>
        <TabLinks
          param="kind"
          tabs={[
            { value: "active", label: "Active", icon: <FaBookOpenReader /> },
            { value: "passive", label: "Passive", icon: <FaHeadphones /> },
          ]}
        />
      </div>

      {KINDS.map((kind) => (
        <TabPanel key={kind} param="kind" value={kind} values={KINDS}>
          <KindPanel
            kind={kind}
            channels={(channels ?? []).filter((c) => c.kind === kind)}
            recommended={recommendedFor(kind)}
            hidden={hidden}
            categories={categories ?? []}
            picked={picked}
          />
        </TabPanel>
      ))}
    </main>
  );
}
