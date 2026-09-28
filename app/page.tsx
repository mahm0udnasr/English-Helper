import { FaBookOpenReader, FaFire, FaHeadphones } from "react-icons/fa6";
import { PiCardsFill } from "react-icons/pi";
import { Suspense } from "react";
import type { ExtraVideo } from "@/app/actions/tasks";
import CategoryDialog from "@/app/components/CategoryDialog";
import HomeVideos from "@/app/components/HomeVideos";
import TaskCard from "@/app/components/TaskCard";
import TimezoneNotice from "@/app/components/TimezoneNotice";
import { getSettings } from "@/lib/supabase/server";
import { computeStats } from "@/lib/stats";
import { todayIn } from "@/lib/today";

export default async function Home() {
  const { supabase, user, settings } = await getSettings();
  const today = todayIn(settings.timezone);

  const [
    { data: tasks },
    { data: extraRows },
    { data: categories },
    { count: pickedCount },
  ] = await Promise.all([
    supabase
      .from("daily_tasks")
      .select("day, kind, minutes")
      .eq("user_id", user.id),
    supabase
      .from("extra_study")
      .select("kind, video_id, title, channel_title, minutes")
      .eq("user_id", user.id)
      .eq("day", today)
      .order("created_at"),
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .order("name"),
    supabase
      .from("user_categories")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);
  const extrasFor = (kind: string): ExtraVideo[] =>
    (extraRows ?? [])
      .filter((e) => e.kind === kind)
      .map((e) => ({
        id: e.video_id,
        title: e.title,
        channelTitle: e.channel_title,
        minutes: e.minutes,
      }));

  const rows = tasks ?? [];
  const done = new Set(rows.filter((t) => t.day === today).map((t) => t.kind));
  const { streak, todayStudied } = computeStats(rows, today);
  const doneCount = ["anki", "active", "passive"].filter((k) =>
    done.has(k),
  ).length;

  const dateLabel = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: settings.timezone,
  }).format(new Date());

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      {!pickedCount && !!categories?.length && (
        <CategoryDialog categories={categories} />
      )}
      <div className="mb-6 empty:hidden">
        <TimezoneNotice saved={settings.timezone} />
      </div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{dateLabel}</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Today&apos;s study
          </h1>
        </div>
        {/* One row on phones: compact streak, full-width progress bar */}
        <div className="flex w-full items-center gap-3 sm:w-auto sm:gap-4">
          <div
            className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-medium sm:px-4 ${
              streak > 0
                ? "bg-streak/10 text-streak"
                : "bg-foreground/5 text-muted"
            }`}
            title={
              todayStudied || streak === 0
                ? "Days in a row with at least one task done"
                : "Finish any task today to keep your streak"
            }
          >
            <FaFire />
            <span>
              {streak} day{streak === 1 ? "" : "s"}
            </span>
            {!todayStudied && streak > 0 && (
              <span className="hidden font-normal opacity-75 sm:inline">
                · keep it today
              </span>
            )}
          </div>
          <div className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none">
            <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-border sm:w-32 sm:flex-none">
              <div
                className="h-full rounded-full bg-done transition-all"
                style={{ width: `${(doneCount / 3) * 100}%` }}
              />
            </div>
            <span className="shrink-0 text-sm font-medium whitespace-nowrap">
              {doneCount}/3 done
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <TaskCard
          kind="anki"
          title="Anki Flashcards"
          description="Finish today's Anki reviews and new cards."
          icon={<PiCardsFill />}
          done={done.has("anki")}
        />
        <TaskCard
          kind="active"
          title="Active Immersion"
          description={`Watch ${settings.active_goal_min} min with full focus: listen closely, pause, note new words.`}
          icon={<FaBookOpenReader />}
          done={done.has("active")}
        >
          <Suspense fallback={<VideoPicksSkeleton />}>
            <HomeVideos
              kind="active"
              goalMin={settings.active_goal_min}
              done={done.has("active")}
              extras={extrasFor("active")}
            />
          </Suspense>
        </TaskCard>
        <TaskCard
          kind="passive"
          title="Passive Immersion"
          description={`Listen for ${settings.passive_goal_min} min in the background while you do other things.`}
          icon={<FaHeadphones />}
          done={done.has("passive")}
        >
          <Suspense fallback={<VideoPicksSkeleton />}>
            <HomeVideos
              kind="passive"
              goalMin={settings.passive_goal_min}
              done={done.has("passive")}
              extras={extrasFor("passive")}
            />
          </Suspense>
        </TaskCard>
      </div>
    </main>
  );
}

function VideoPicksSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-2" aria-hidden>
      <div className="h-3 w-24 rounded bg-border" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="aspect-video w-full rounded-lg bg-border" />
            <div className="h-3 rounded bg-border" />
            <div className="h-3 w-2/3 rounded bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
