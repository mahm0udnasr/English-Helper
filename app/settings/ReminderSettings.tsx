"use client";

import { useActionState, useEffect, useState } from "react";
import { FaBell, FaBellSlash } from "react-icons/fa6";
import { serviceWorkerReady, urlBase64ToUint8Array } from "@/lib/pwa";
import {
  deletePushSubscription,
  saveReminderTime,
  savePushSubscription,
  type ReminderTimeState,
} from "./reminders";

type Status = "unsupported" | "ios-install" | "denied" | "off" | "on";

async function detectStatus(): Promise<{
  status: Status;
  sub?: PushSubscription;
}> {
  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window;
  if (!supported) {
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    return { status: isIOS ? "ios-install" : "unsupported" };
  }
  if (Notification.permission === "denied") return { status: "denied" };
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub ? { status: "on", sub } : { status: "off" };
}

// "Registration failed - push service error" (AbortError) means the browser
// couldn't reach its push service. Brave disables it by default.
async function explainSubscribeError(e: unknown): Promise<string> {
  if (!(e instanceof Error)) return "Couldn't turn on reminders.";
  if (e.name !== "AbortError" && !/push service/i.test(e.message)) {
    return e.message;
  }
  const brave = navigator as Navigator & {
    brave?: { isBrave(): Promise<boolean> };
  };
  if (await brave.brave?.isBrave().catch(() => false)) {
    return 'Brave blocks push notifications by default. Open brave://settings/privacy, turn on "Use Google services for push messaging", restart Brave, and try again.';
  }
  return "Your browser couldn't reach its push service. Check that notifications aren't disabled in the browser's settings, or try Chrome, Edge or Firefox.";
}

export default function ReminderSettings({
  reminderTime,
  vapidPublicKey,
}: {
  reminderTime: string; // "HH:MM:SS"
  vapidPublicKey: string | null;
}) {
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [timeState, timeAction, timePending] = useActionState<
    ReminderTimeState,
    FormData
  >(saveReminderTime, {});

  useEffect(() => {
    let cancelled = false;
    detectStatus().then(({ status, sub }) => {
      if (cancelled) return;
      setStatus(status);
      // Re-save in case the server dropped it or another account signed in here.
      if (sub) savePushSubscription(sub.toJSON(), navigator.userAgent);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setMessage(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      if (!vapidPublicKey) throw new Error("Reminder service is unavailable.");
      const reg = await serviceWorkerReady();
      if (!reg)
        throw new Error("Service worker isn't ready. Reload and try again.");

      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
        }));
      const result = await savePushSubscription(
        sub.toJSON(),
        navigator.userAgent,
      );
      if (result.error) throw new Error(result.error);
      setStatus("on");
    } catch (e) {
      setMessage(await explainSubscribeError(e));
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setMessage(null);
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = await reg?.pushManager.getSubscription();
      if (sub) {
        await deletePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form action={timeAction} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Reminder time
          <input
            type="time"
            name="reminder_time"
            defaultValue={reminderTime.slice(0, 5)}
            required
            className="input"
          />
        </label>
        <button type="submit" disabled={timePending} className="btn-ghost py-2">
          {timePending ? "Saving…" : "Save time"}
        </button>
        {timeState.saved && !timePending && (
          <span className="pb-2 text-sm text-done">Saved ✓</span>
        )}
        {timeState.error && (
          <span className="pb-2 text-sm text-red-500">{timeState.error}</span>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-background p-4">
        <div className="text-sm">
          <p className="font-medium">This device</p>
          <p className="text-muted">
            {status === null && "Checking…"}
            {status === "on" && "Reminders are on."}
            {status === "off" && "Reminders are off."}
            {status === "denied" &&
              "Notifications are blocked. Allow them in your browser's site settings."}
            {status === "ios-install" &&
              "On iPhone/iPad, install the app to your Home Screen first (see Install app below), then open it from there."}
            {status === "unsupported" &&
              "This browser doesn't support push notifications."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {status === "on" && (
            <button
              type="button"
              onClick={disable}
              disabled={busy}
              className="btn-ghost"
            >
              <FaBellSlash /> Turn off
            </button>
          )}
          {status === "off" && (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="btn-primary"
            >
              <FaBell /> {busy ? "Turning on…" : "Turn on reminders"}
            </button>
          )}
        </div>
      </div>

      {message && <p className="text-sm text-muted">{message}</p>}
    </div>
  );
}
