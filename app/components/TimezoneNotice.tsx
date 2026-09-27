"use client";

import { useSyncExternalStore, useTransition } from "react";
import { FaClock } from "react-icons/fa6";
import { setTimezone } from "@/app/settings/actions";

const deviceTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const noSubscribe = () => () => {};

// Warns when the saved timezone differs from this device's. The day reset,
// streaks and reminders all use the saved one, so a mismatch shifts them.
export default function TimezoneNotice({ saved }: { saved: string }) {
  // null on the server; the device timezone is only known in the browser.
  const device = useSyncExternalStore(noSubscribe, deviceTimezone, () => null);
  const [pending, startTransition] = useTransition();

  if (!device || device === saved) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-streak/40 bg-streak/10 px-4 py-3 text-sm">
      <p className="flex items-start gap-2">
        <FaClock className="mt-0.5 shrink-0 text-streak" />
        <span>
          Your settings use <strong>{saved}</strong>, but this device is in{" "}
          <strong>{device}</strong>. Your day, streak and reminders follow the
          settings timezone.
        </span>
      </p>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(() => setTimezone(device).then(() => {}))
        }
        className="btn-primary shrink-0 py-1.5 text-sm"
      >
        {pending ? "Updating…" : `Use ${device}`}
      </button>
    </div>
  );
}
