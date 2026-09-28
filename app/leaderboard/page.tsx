import type { Metadata } from "next";
import { FaFire, FaTrophy } from "react-icons/fa6";
import { TabLinks, TabPanel } from "@/app/components/UrlTabs";
import { formatHours } from "@/lib/stats";
import { getSettings } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Leaderboard · English Helper" };

const SORTS = [
  { by: "hours", label: "Immersion hours" },
  { by: "streak", label: "Streak" },
  { by: "perfect", label: "Perfect days" },
] as const;

type SortBy = (typeof SORTS)[number]["by"];
const SORT_VALUES = SORTS.map((s) => s.by);

const MEDALS = ["🥇", "🥈", "🥉"];

type Row = {
  display_name: string;
  is_me: boolean;
  active_min: number;
  passive_min: number;
  current_streak: number;
  perfect_days: number;
  totalMin: number;
};

function LeaderboardTable({ rows }: { rows: Row[] }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-xs text-muted">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Learner</th>
            <th className="px-4 py-3 text-right font-medium">Immersion</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Active / Passive
            </th>
            <th className="px-4 py-3 text-right font-medium">Streak</th>
            <th className="hidden px-4 py-3 text-right font-medium sm:table-cell">
              Perfect days
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`border-b border-border last:border-0 ${
                r.is_me ? "bg-accent/10 font-medium" : ""
              }`}
            >
              <td className="px-4 py-3 text-base">
                {MEDALS[i] ?? <span className="text-muted">{i + 1}</span>}
              </td>
              <td className="px-4 py-3">
                {r.display_name}
                {r.is_me && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                    You
                  </span>
                )}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatHours(r.totalMin)}
              </td>
              <td className="hidden px-4 py-3 text-right text-muted tabular-nums sm:table-cell">
                {formatHours(r.active_min)} / {formatHours(r.passive_min)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">
                <span className="inline-flex items-center gap-1">
                  {r.current_streak}
                  <FaFire
                    className={
                      r.current_streak > 0 ? "text-streak" : "text-muted"
                    }
                  />
                </span>
              </td>
              <td className="hidden px-4 py-3 text-right tabular-nums sm:table-cell">
                {r.perfect_days}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Every sort is rendered up front so switching tabs doesn't hit the server.
export default async function LeaderboardPage() {
  const { supabase, settings } = await getSettings();
  const { data, error } = await supabase.rpc("get_leaderboard");

  const rows = (data ?? []).map((r) => ({
    ...r,
    totalMin: r.active_min + r.passive_min,
  }));
  const sortRows = (by: SortBy) =>
    rows.toSorted((a, b) => {
      const key = (r: Row) =>
        by === "streak"
          ? r.current_streak
          : by === "perfect"
            ? r.perfect_days
            : r.totalMin;
      return key(b) - key(a) || b.totalMin - a.totalMin;
    });

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-semibold tracking-tight">
            Leaderboard
          </h1>
          {/* <p className="mt-1 text-sm text-muted">
            {settings.leaderboard_anonymous
              ? 'Others see you as "Anonymous learner".'
              : `Others see you as "${settings.display_name?.trim() || "Anonymous learner"}".`}{" "}
            <Link href="/settings" className="text-accent hover:underline">
              Change in Settings
            </Link>
          </p> */}
        </div>
        <TabLinks
          param="by"
          tabs={SORTS.map((s) => ({ value: s.by, label: s.label }))}
        />
      </div>

      {error ? (
        <p className="card text-sm text-red-500">
          Couldn&apos;t load the leaderboard: {error.message}
        </p>
      ) : rows.length === 0 ? (
        <p className="card py-12 text-center text-muted">
          No one has completed a task yet. Check off a task on Home to get on
          the board!
        </p>
      ) : (
        SORTS.map((s) => (
          <TabPanel key={s.by} param="by" value={s.by} values={SORT_VALUES}>
            <LeaderboardTable rows={sortRows(s.by)} />
          </TabPanel>
        ))
      )}
    </main>
  );
}
