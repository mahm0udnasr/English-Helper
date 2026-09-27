"use server";

import { revalidatePath } from "next/cache";
import { createClient, getSettings, requireUser } from "@/lib/supabase/server";
import { todayIn } from "@/lib/today";

const FUNCTION_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-reminders`;

// Public VAPID key the browser needs to subscribe. The send-reminders Edge
// Function creates the key pair on first use, so ask it if none exists yet.
export async function getVapidPublicKey(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_vapid_public_key");
  if (data) return data;

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mode: "init" }),
  }).catch(() => null);
  if (!res?.ok) return null;
  const json = (await res.json()) as { publicKey?: string };
  return json.publicKey ?? null;
}

type BrowserSubscription = {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
};

export async function savePushSubscription(
  sub: BrowserSubscription,
  userAgent: string,
) {
  const { endpoint, keys } = sub;
  if (!endpoint?.startsWith("https://") || !keys?.p256dh || !keys?.auth) {
    return { error: "Invalid subscription." };
  }
  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("push_subscriptions").upsert({
    user_id: user.id,
    endpoint,
    p256dh: keys.p256dh,
    auth: keys.auth,
    user_agent: userAgent.slice(0, 300),
  });
  return error ? { error: error.message } : {};
}

export async function deletePushSubscription(endpoint: string) {
  const { supabase, user } = await requireUser();
  await supabase
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);
}

export type ReminderTimeState = { error?: string; saved?: boolean };

export async function saveReminderTime(
  _prev: ReminderTimeState,
  formData: FormData,
): Promise<ReminderTimeState> {
  const time = String(formData.get("reminder_time") ?? "");
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return { error: "Pick a valid time." };
  }

  const { supabase, user, settings } = await getSettings();
  // If the new time already passed today, start tomorrow instead of firing now.
  const now = new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: settings.timezone,
  }).format(new Date());

  const { error } = await supabase
    .from("user_settings")
    .update({
      reminder_time: time,
      last_reminded_on: time <= now ? todayIn(settings.timezone) : null,
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/settings");
  return { saved: true };
}
