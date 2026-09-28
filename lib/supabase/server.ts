import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";
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
// getClaims verifies the session JWT locally (no request to Supabase Auth,
// given asymmetric signing keys), and cache() shares one result per request
// between layouts, pages and helpers.
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) redirect("/login");
  const { sub, email } = data.claims;
  return { supabase, user: { id: sub, email } };
});

// Like getSettings, but 404s for anyone who isn't an admin. The role lives in
// app_metadata, which only the service role can write (users can edit their
// own user_settings, so a flag there could be self-granted). It's read live
// with getUser rather than from the JWT, which can be up to an hour stale.
export const requireAdmin = cache(async () => {
  const result = await getSettings();
  const {
    data: { user },
  } = await result.supabase.auth.getUser();
  if (user?.app_metadata.role !== "admin") notFound();
  return result;
});

export const getSettings = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  // Defaults first, so a column the database doesn't have yet (e.g. before a
  // migration is pushed) still reads as its default instead of undefined.
  return {
    supabase,
    user,
    settings: {
      user_id: user.id,
      active_goal_min: 30,
      passive_goal_min: 60,
      videos_per_channel: 6,
      timezone: "UTC",
      display_name: null,
      leaderboard_anonymous: false,
      reminder_time: "20:00:00",
      show_active_defaults: true,
      show_passive_defaults: true,
      last_reminded_on: null,
      updated_at: new Date().toISOString(),
      ...data,
    },
  };
});
