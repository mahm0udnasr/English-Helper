"use client";

import { useActionState } from "react";
import type { Tables } from "@/lib/database.types";
import { saveSettings, type SettingsState } from "./actions";

export default function SettingsForm({
  settings,
}: {
  settings: Tables<"user_settings">;
}) {
  const [state, action, pending] = useActionState<SettingsState, FormData>(
    saveSettings,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-4 sm:grid-cols-2">
        {!settings.display_name?.trim() && (
          <label className="flex flex-col gap-1 text-sm">
            Your name (shown on the leaderboard)
            <input
              name="display_name"
              required
              maxLength={30}
              className="input"
            />
          </label>
        )}
        <label className="flex items-start gap-3 text-sm sm:col-span-2">
          <input
            type="checkbox"
            name="leaderboard_anonymous"
            defaultChecked={settings.leaderboard_anonymous}
            className="mt-0.5 size-4 accent-accent"
          />
          <span>
            Appear anonymously on the leaderboard
            <span className="block text-xs text-muted">
              Others will see &quot;Anonymous learner&quot; instead of your
              name. Your stats still count.
            </span>
          </span>
        </label>
        <Field
          label="Active immersion goal (min/day)"
          name="active_goal_min"
          defaultValue={settings.active_goal_min}
          max={1440}
        />
        <Field
          label="Passive immersion goal (min/day)"
          name="passive_goal_min"
          defaultValue={settings.passive_goal_min}
          max={1440}
        />
        <label className="flex flex-col gap-1 text-sm">
          Timezone (the day resets at midnight here)
          <div className="flex gap-2">
            <input
              name="timezone"
              defaultValue={settings.timezone}
              required
              className="input min-w-0 flex-1"
            />
            <button
              type="button"
              className="btn-ghost"
              onClick={(e) => {
                const input = e.currentTarget
                  .previousElementSibling as HTMLInputElement;
                input.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
              }}
            >
              Detect
            </button>
          </div>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state.saved && !pending && (
          <span className="text-sm text-done">Saved ✓</span>
        )}
        {state.error && (
          <span className="text-sm text-red-500">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  max,
}: {
  label: string;
  name: string;
  defaultValue: number;
  max: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min={1}
        max={max}
        required
        className="input"
      />
    </label>
  );
}
