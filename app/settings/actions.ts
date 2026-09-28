"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { isValidTimezone } from "@/lib/today";

export type SettingsState = { error?: string; saved?: boolean };

function readInt(formData: FormData, name: string, min: number, max: number) {
  const n = Number(formData.get(name));
  return Number.isInteger(n) && n >= min && n <= max ? n : null;
}

export async function saveSettings(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const active = readInt(formData, "active_goal_min", 1, 1440);
  const passive = readInt(formData, "passive_goal_min", 1, 1440);
  const timezone = String(formData.get("timezone") ?? "").trim();
  // Only sent by accounts created before sign-up asked for a name.
  const displayName = formData.has("display_name")
    ? String(formData.get("display_name")).trim()
    : null;
  const anonymous = formData.get("leaderboard_anonymous") === "on";

  if (active === null || passive === null)
    return { error: "Goals must be whole minutes between 1 and 1440." };
  if (displayName !== null && (!displayName || displayName.length > 30))
    return { error: "Name must be 1–30 characters." };
  if (!isValidTimezone(timezone))
    return { error: `Unknown timezone "${timezone}".` };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("user_settings").upsert({
    user_id: user.id,
    active_goal_min: active,
    passive_goal_min: passive,
    timezone,
    ...(displayName !== null && { display_name: displayName }),
    leaderboard_anonymous: anonymous,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { saved: true };
}

// One-tap fix when the saved timezone doesn't match the device's.
export async function setTimezone(timezone: string) {
  if (!isValidTimezone(timezone)) return { error: "Unknown timezone." };
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_settings")
    .update({ timezone, updated_at: new Date().toISOString() })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}

// Turns the admin's recommended channels on or off for one kind.
export async function setShowDefaults(
  kind: "active" | "passive",
  on: boolean,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("user_settings")
    .update({
      ...(kind === "active"
        ? { show_active_defaults: on }
        : { show_passive_defaults: on }),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return {};
}
