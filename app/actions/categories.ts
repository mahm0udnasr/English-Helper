"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

// Replaces the user's passive categories. At least one is required: with none,
// passive videos only come from channels they added themselves.
export async function saveCategories(
  categoryIds: string[],
): Promise<{ error?: string }> {
  const ids = [...new Set(categoryIds)];
  if (ids.length === 0) return { error: "Pick at least one category." };

  const { supabase, user } = await requireUser();
  // Add the new picks before removing old ones, so a failure midway never
  // leaves the user with no categories (which would reopen the dialog).
  const { error: upsertError } = await supabase
    .from("user_categories")
    .upsert(ids.map((category_id) => ({ user_id: user.id, category_id })));
  if (upsertError) return { error: upsertError.message };

  const { error: deleteError } = await supabase
    .from("user_categories")
    .delete()
    .eq("user_id", user.id)
    .not("category_id", "in", `(${ids.join(",")})`);
  if (deleteError) return { error: deleteError.message };

  revalidatePath("/");
  revalidatePath("/channels");
  return {};
}
