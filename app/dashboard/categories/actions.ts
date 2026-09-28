"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";

export type FormState = { error?: string; ok?: boolean };

function cleanName(value: unknown) {
  const name = String(value ?? "").trim();
  if (!name) return { error: "Please enter a name." };
  if (name.length > 40)
    return { error: "Name must be 40 characters or fewer." };
  return { name };
}

function errorMessage(error: { code?: string; message: string }, name: string) {
  return error.code === "23505"
    ? `There's already a category called "${name}".`
    : error.message;
}

function revalidate() {
  revalidatePath("/dashboard/categories");
  revalidatePath("/dashboard/channels");
  revalidatePath("/channels");
  revalidatePath("/");
}

export async function addCategory(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = cleanName(formData.get("name"));
  if (!parsed.name) return { error: parsed.error };

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("categories")
    .insert({ name: parsed.name });
  if (error) return { error: errorMessage(error, parsed.name) };

  revalidate();
  return { ok: true };
}

export async function renameCategory(id: string, name: string) {
  const parsed = cleanName(name);
  if (!parsed.name) return { error: parsed.error };

  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.name })
    .eq("id", id);
  if (error) return { error: errorMessage(error, parsed.name) };

  revalidate();
  return {};
}

// Also deletes the category's channels and users' picks of it (cascade).
export async function deleteCategory(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}
