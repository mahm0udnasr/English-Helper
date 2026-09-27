// Sends daily study reminders as Web Push notifications.
//
// Modes (JSON body { mode }):
//   "cron" (default) - called by pg_cron with the x-cron-secret header; reminds
//                      every user whose reminder time is due.
//   "test"           - called by a signed-in user (Authorization: Bearer <jwt>);
//                      sends a test notification to that user's devices.
//   "init"           - makes sure VAPID keys exist and returns the public key.
//
// VAPID keys are generated on first run and kept in Supabase Vault.
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const VAPID_SUBJECT = "https://github.com/mahm0udnasr/English-Helper";

type Config = {
  vapid_public: string | null;
  vapid_private: string | null;
  cron_secret: string | null;
};

type Payload = { title: string; body: string; url: string; tag: string };

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function loadConfig(): Promise<Config> {
  const read = async () => {
    const { data, error } = await supabase.rpc("push_config");
    if (error) throw error;
    return (data?.[0] ?? {}) as Config;
  };

  let config = await read();
  if (!config.vapid_public || !config.vapid_private) {
    const keys = webpush.generateVAPIDKeys();
    const { error } = await supabase.rpc("set_vapid_keys", {
      p_public: keys.publicKey,
      p_private: keys.privateKey,
    });
    if (error) throw error;
    config = await read(); // another invocation may have stored keys first
  }
  webpush.setVapidDetails(
    VAPID_SUBJECT,
    config.vapid_public!,
    config.vapid_private!,
  );
  return config;
}

// Sends to all of a user's devices; drops subscriptions the push service
// reports as gone (404/410). Returns how many devices received it.
async function sendToUser(userId: string, payload: Payload) {
  const { data: subs, error } = await supabase
    .from("push_subscriptions")
    .select("endpoint, p256dh, auth")
    .eq("user_id", userId);
  if (error) throw error;

  let sent = 0;
  for (const sub of subs ?? []) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify(payload),
        { TTL: 60 * 60 * 2 },
      );
      sent++;
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 404 || status === 410) {
        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("user_id", userId)
          .eq("endpoint", sub.endpoint);
      } else {
        console.error("push failed", status, (err as Error).message);
      }
    }
  }
  return sent;
}

const LABELS: Record<string, string> = {
  anki: "Anki flashcards",
  active: "Active immersion",
  passive: "Passive immersion",
};

type Due = {
  user_id: string;
  local_day: string;
  remaining: string[];
  active_goal_min: number;
  passive_goal_min: number;
};

function reminderFor(due: Due): Payload {
  const parts = due.remaining.map((k) =>
    k === "active"
      ? `${LABELS.active} (${due.active_goal_min} min)`
      : k === "passive"
        ? `${LABELS.passive} (${due.passive_goal_min} min)`
        : LABELS[k],
  );
  return {
    title: "Time to study English 📚",
    body: `Still to do today: ${parts.join(", ")}`,
    url: "/",
    tag: "daily-reminder",
  };
}

async function runCron() {
  const { data, error } = await supabase.rpc("due_reminders");
  if (error) throw error;

  let notified = 0;
  for (const due of (data ?? []) as Due[]) {
    if (due.remaining.length > 0) {
      notified += (await sendToUser(due.user_id, reminderFor(due))) > 0 ? 1 : 0;
    }
    // Mark as handled even when everything is done, so we don't re-check today.
    await supabase
      .from("user_settings")
      .update({ last_reminded_on: due.local_day })
      .eq("user_id", due.user_id);
  }
  return { due: data?.length ?? 0, notified };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  try {
    const body = await req.json().catch(() => ({}));
    const mode = (body as { mode?: string }).mode ?? "cron";
    const config = await loadConfig();

    if (mode === "init") {
      return json({ publicKey: config.vapid_public });
    }

    if (mode === "test") {
      const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
      const { data, error } = await supabase.auth.getUser(token);
      if (error || !data.user) return json({ error: "Unauthorized" }, 401);
      const sent = await sendToUser(data.user.id, {
        title: "Reminders are on ✅",
        body: "This is how your daily study reminder will look.",
        url: "/settings",
        tag: "test-reminder",
      });
      return json({ sent });
    }

    if (req.headers.get("x-cron-secret") !== config.cron_secret) {
      return json({ error: "Unauthorized" }, 401);
    }
    return json(await runCron());
  } catch (err) {
    console.error(err);
    return json({ error: (err as Error).message }, 500);
  }
});
