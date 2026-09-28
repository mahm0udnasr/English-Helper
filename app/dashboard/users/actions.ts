"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";

// The database functions check the admin role too; requireAdmin just keeps
// non-admins from reaching them through this action.
export async function setUserBlocked(userId: string, blocked: boolean) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_user_blocked", {
    p_user_id: userId,
    p_blocked: blocked,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/users");
  return {};
}

export async function deleteUser(userId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_delete_user", {
    p_user_id: userId,
  });
  if (error) return { error: error.message };
  revalidatePath("/dashboard/users");
  return {};
}
