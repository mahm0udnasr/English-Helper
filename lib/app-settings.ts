import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";

// The admin's settings for everyone (see Dashboard → Settings). Defaults
// apply when the row can't be read, e.g. before the migration is pushed.
export async function getAppSettings(supabase: SupabaseClient<Database>) {
  const { data } = await supabase
    .from("app_settings")
    .select("transcripts_enabled")
    .maybeSingle();
  return { transcripts_enabled: true, ...data };
}
