"use server";

import { revalidatePath, updateTag } from "next/cache";
import { requireUser } from "@/lib/supabase/server";
import { resolveChannel, videosTag } from "@/lib/youtube";

export type AddChannelState = { error?: string; ok?: boolean };

export async function addChannel(
  _prev: AddChannelState,
  formData: FormData,
): Promise<AddChannelState> {
  const input = String(formData.get("channel") ?? "");
  const kind = String(formData.get("kind") ?? "");
  if (kind !== "active" && kind !== "passive")
    return { error: "Invalid type." };

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

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("channels").insert({
    user_id: user.id,
    kind,
    youtube_channel_id: channel.id,
    title: channel.title,
    thumbnail_url: channel.thumbnailUrl,
  });
  if (error) {
    return {
      error:
        error.code === "23505"
          ? `"${channel.title}" is already in your ${kind} list.`
          : error.message,
    };
  }

  revalidatePath("/channels");
  revalidatePath("/");
  return { ok: true };
}

export async function removeChannel(id: string) {
  const { supabase, user } = await requireUser();
  await supabase.from("channels").delete().eq("id", id).eq("user_id", user.id);
  revalidatePath("/channels");
  revalidatePath("/");
}

// Re-fetch the channel's name/photo and drop its cached video list.
export async function syncChannel(id: string): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { data: row } = await supabase
    .from("channels")
    .select("youtube_channel_id")
    .eq("id", id)
    .eq("user_id", user.id)
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
    .from("channels")
    .update({ title: channel.title, thumbnail_url: channel.thumbnailUrl })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: error.message };

  updateTag(videosTag(row.youtube_channel_id));
  revalidatePath("/channels");
  revalidatePath("/");
  return {};
}

// Hide or show one of the admin's default channels for this user.
export async function setDefaultChannelHidden(
  defaultChannelId: string,
  hidden: boolean,
): Promise<{ error?: string }> {
  const { supabase, user } = await requireUser();
  const { error } = hidden
    ? await supabase
        .from("hidden_default_channels")
        .upsert({ user_id: user.id, default_channel_id: defaultChannelId })
    : await supabase
        .from("hidden_default_channels")
        .delete()
        .eq("user_id", user.id)
        .eq("default_channel_id", defaultChannelId);
  if (error) return { error: error.message };

  revalidatePath("/channels");
  revalidatePath("/");
  return {};
}
