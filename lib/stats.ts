import { addDays } from "@/lib/today";

type TaskRow = { day: string; kind: string; minutes: number };
type ExtraRow = { kind: string; minutes: number };

export function formatHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

// All-time totals plus the current streak: consecutive days with at least one
// task done, ending today (or yesterday, if nothing is done yet today).
// A "perfect day" is a day with all 3 tasks done. Extra videos add minutes only.
export function computeStats(
  rows: TaskRow[],
  today: string,
  extras: ExtraRow[] = [],
) {
  let activeMin = 0;
  let passiveMin = 0;
  let ankiDays = 0;
  const perDay = new Map<string, number>();

  for (const t of rows) {
    if (t.kind === "active") activeMin += t.minutes;
    else if (t.kind === "passive") passiveMin += t.minutes;
    else if (t.kind === "anki") ankiDays++;
    perDay.set(t.day, (perDay.get(t.day) ?? 0) + 1);
  }
  for (const e of extras) {
    if (e.kind === "active") activeMin += e.minutes;
    else if (e.kind === "passive") passiveMin += e.minutes;
  }

  const studied = (day: string) => perDay.has(day);
  const todayStudied = studied(today);

  let day = todayStudied ? today : addDays(today, -1);
  let streak = 0;
  while (studied(day)) {
    streak++;
    day = addDays(day, -1);
  }

  return {
    activeMin,
    passiveMin,
    ankiDays,
    streak,
    todayStudied,
    perfectDays: [...perDay.values()].filter((n) => n >= 3).length,
  };
}
