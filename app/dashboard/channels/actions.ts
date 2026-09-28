"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireAdmin } from "@/lib/supabase/server";
import { resolveChannel, videosTag } from "@/lib/youtube";

export type AddDefaultChannelState = { error?: string; ok?: boolean };

function revalidate() {
  revalidatePath("/dashboard/channels");
  revalidatePath("/dashboard/categories");
  revalidatePath("/channels");
  revalidatePath("/");
}

export async function addDefaultChannel(
  _prev: AddDefaultChannelState,
  formData: FormData,
): Promise<AddDefaultChannelState> {
  const input = String(formData.get("channel") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "active" && kind !== "passive")
    return { error: "Invalid type." };
  const categoryId = String(formData.get("category_id") ?? "") || null;
  if (kind === "passive" && !categoryId)
    return { error: "Pick a category for passive channels." };

  const { supabase } = await requireAdmin();

  let channel;
  try {
    channel = await resolveChannel(input);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "YouTube request failed.",
    };
  }
  if (!channel) {
    return { error: "Channel not found. Try @handle or a youtube.com link." };
  }

  const { error } = await supabase.from("default_channels").insert({
    kind,
    category_id: kind === "passive" ? categoryId : null,
    youtube_channel_id: channel.id,
    title: channel.title,
    thumbnail_url: channel.thumbnailUrl,
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? `"${channel.title}" is already a default ${kind} channel.`
          : error.message,
    };
  }

  revalidate();
  return { ok: true };
}

export async function deleteDefaultChannel(id: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("default_channels")
    .delete()
    .eq("id", id);
  if (error) return { error: error.message };

  revalidate();
  return {};
}

// Re-fetch the channel's name/photo and drop its cached video list.
export async function syncDefaultChannel(id: string) {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("default_channels")
    .select("youtube_channel_id")
    .eq("id", id)
    .maybeSingle();
  if (!row) return { error: "Channel not found." };

  let channel;
  try {
    channel = await resolveChannel(row.youtube_channel_id);
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "YouTube request failed.",
    };
  }
  if (!channel) return { error: "This channel no longer exists on YouTube." };

  const { error } = await supabase
    .from("default_channels")
    .update({ title: channel.title, thumbnail_url: channel.thumbnailUrl })
    .eq("id", id);
  if (error) return { error: error.message };

  updateTag(videosTag(row.youtube_channel_id));
  revalidate();
  return {};
}
