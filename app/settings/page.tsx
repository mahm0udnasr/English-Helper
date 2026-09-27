import type { Metadata } from "next";
import { FaArrowRightFromBracket } from "react-icons/fa6";
import { signOut } from "@/app/login/actions";
import { getSettings } from "@/lib/supabase/server";
import { computeStats, formatHours } from "@/lib/stats";
import { todayIn } from "@/lib/today";
import TimezoneNotice from "@/app/components/TimezoneNotice";
import SettingsForm from "./SettingsForm";
import InstallApp from "./InstallApp";
import ReminderSettings from "./ReminderSettings";
import { getVapidPublicKey } from "./reminders";
import ThemeSwitch from "./ThemeSwitch";

export const metadata: Metadata = { title: "Settings · English Helper" };

export default async function SettingsPage() {
  const { supabase, user, settings } = await getSettings();
  const [{ data: tasks }, { data: extras }, vapidPublicKey] = await Promise.all(
    [
      supabase
        .from("daily_tasks")
        .select("day, kind, minutes")
        .eq("user_id", user.id),
      supabase
        .from("extra_study")
        .select("kind, minutes")
        .eq("user_id", user.id),
      getVapidPublicKey(),
    ],
  );

  const { activeMin, passiveMin, ankiDays, streak, perfectDays } = computeStats(
    tasks ?? [],
    todayIn(settings.timezone),
    extras ?? [],
  );

  const stats = [
    { label: "Active immersion", value: formatHours(activeMin) },
    { label: "Passive immersion", value: formatHours(passiveMin) },
    { label: "Total immersion", value: formatHours(activeMin + passiveMin) },
    { label: "Anki days", value: String(ankiDays) },
    { label: "Current streak", value: `${streak}` },
    { label: "Perfect days", value: String(perfectDays) },
  ];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
      <TimezoneNotice saved={settings.timezone} />

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">All-time study</h2>
        <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-background p-4">
              <dt className="text-xs text-muted">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card">
        <h2 className="mb-4 text-lg font-semibold">
          Daily goals & preferences
        </h2>
        <SettingsForm settings={settings} />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold">Daily reminder</h2>
        <p className="mb-4 text-sm text-muted">
          Get a notification at this time if today&apos;s tasks aren&apos;t done
          yet, even when the app is closed. Turn it on for each phone or
          computer you use.
        </p>
        <ReminderSettings
          reminderTime={settings.reminder_time}
          vapidPublicKey={vapidPublicKey}
        />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Appearance</h2>
          <p className="text-sm text-muted">
            Device follows your system&apos;s light/dark setting.
          </p>
        </div>
        <ThemeSwitch />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Install app</h2>
          <p className="text-sm text-muted">
            Add English Helper to your home screen or desktop.
          </p>
        </div>
        <InstallApp />
      </section>

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">Account</h2>
          <p className="text-sm text-muted">{user.email}</p>
        </div>
        <form action={signOut}>
          <button type="submit" className="btn-ghost">
            <FaArrowRightFromBracket /> Sign out
          </button>
        </form>
      </section>
    </main>
  );
}
