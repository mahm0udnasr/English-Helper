import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Database } from "@/lib/database.types";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component; proxy.ts refreshes the session instead.
          }
        },
      },
    },
  );
}

// Supabase client plus the signed-in user; redirects to /login otherwise.
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Like getSettings, but 404s for anyone who isn't an admin. The role lives in
// app_metadata, which only the service role can write (users can edit their
// own user_settings, so a flag there could be self-granted).
export async function requireAdmin() {
  const result = await getSettings();
  if (result.user.app_metadata.role !== "admin") notFound();
  return result;
}

export async function getSettings() {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    supabase,
    user,
    settings: data ?? {
      user_id: user.id,
      active_goal_min: 30,
      passive_goal_min: 60,
      videos_per_channel: 6,
      timezone: "UTC",
      display_name: null,
      leaderboard_anonymous: false,
      reminder_time: "20:00:00",
      last_reminded_on: null,
      updated_at: new Date().toISOString(),
    },
  };
}
