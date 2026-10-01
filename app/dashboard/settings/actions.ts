"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";

export async function setTranscriptsEnabled(on: boolean) {
  const { supabase } = await requireAdmin();
  const { data, error } = await supabase
    .from("app_settings")
    .update({ transcripts_enabled: on, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select("id");
  if (error) return { error: error.message };
  if (!data.length) return { error: "Settings row is missing." };

  revalidatePath("/dashboard/settings");
  revalidatePath("/");
  return {};
}
