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

export type ImportResult = {
  error?: string;
  categoriesCreated?: number;
  added?: number;
  skipped?: { category: string; link: string; reason: string }[];
};

const MAX_IMPORT_LINKS = 500;
const LOOKUP_CONCURRENCY = 5;

// Imports passive channels from a spreadsheet: one column per category, the
// category name in the first row and channel links below. Missing categories
// are created; channels already added (in any category) are skipped.
export async function importPassiveChannels(
  columns: { name: string; links: string[] }[],
): Promise<ImportResult> {
  if (
    !Array.isArray(columns) ||
    !columns.every(
      (c) =>
        typeof c?.name === "string" &&
        Array.isArray(c.links) &&
        c.links.every((l) => typeof l === "string"),
    )
  )
    return { error: "Invalid file contents." };

  const cleaned = columns
    .map((c) => ({
      name: c.name.trim(),
      links: c.links.map((l) => l.trim()).filter(Boolean),
    }))
    .filter((c) => c.name);
  if (!cleaned.length)
    return { error: "No categories found in the first row." };
  const tooLong = cleaned.find((c) => c.name.length > 40);
  if (tooLong)
    return {
      error: `Category "${tooLong.name}" is longer than 40 characters.`,
    };
  const total = cleaned.reduce((n, c) => n + c.links.length, 0);
  if (total > MAX_IMPORT_LINKS)
    return {
      error: `The file has ${total} links; import at most ${MAX_IMPORT_LINKS} at a time.`,
    };

  const { supabase } = await requireAdmin();

  // Reuse existing categories, matching names regardless of case.
  const { data: existing, error: categoriesError } = await supabase
    .from("categories")
    .select("id, name");
  if (categoriesError) return { error: categoriesError.message };
  const categoryIds = new Map(
    existing.map((c) => [c.name.toLowerCase(), c.id]),
  );
  const missing = [
    ...new Map(
      cleaned
        .filter((c) => !categoryIds.has(c.name.toLowerCase()))
        .map((c) => [c.name.toLowerCase(), c.name]),
    ).values(),
  ];
  if (missing.length) {
    const { data: created, error } = await supabase
      .from("categories")
      .insert(missing.map((name) => ({ name })))
      .select("id, name");
    if (error) return { error: error.message };
    for (const c of created) categoryIds.set(c.name.toLowerCase(), c.id);
  }

  const { data: taken, error: takenError } = await supabase
    .from("default_channels")
    .select("youtube_channel_id")
    .eq("kind", "passive");
  if (takenError) return { error: takenError.message };
  const takenIds = new Set(taken.map((c) => c.youtube_channel_id));

  const jobs = cleaned.flatMap((c) =>
    c.links.map((link) => ({
      category: c.name,
      categoryId: categoryIds.get(c.name.toLowerCase())!,
      link,
    })),
  );
  const resolved = new Array<Awaited<ReturnType<typeof resolveChannel>>>(
    jobs.length,
  );
  const failed = new Map<number, string>();
  let next = 0;
  await Promise.all(
    Array.from({ length: LOOKUP_CONCURRENCY }, async () => {
      while (next < jobs.length) {
        const i = next++;
        try {
          resolved[i] = await resolveChannel(jobs[i].link);
        } catch (e) {
          failed.set(
            i,
            e instanceof Error ? e.message : "YouTube request failed.",
          );
        }
      }
    }),
  );

  const skipped: NonNullable<ImportResult["skipped"]> = [];
  const rows = [];
  for (const [i, job] of jobs.entries()) {
    const channel = resolved[i];
    const skip = (reason: string) =>
      skipped.push({ category: job.category, link: job.link, reason });
    if (failed.has(i)) skip(failed.get(i)!);
    else if (!channel) skip("Channel not found");
    else if (takenIds.has(channel.id)) skip(`"${channel.title}" already added`);
    else {
      takenIds.add(channel.id);
      rows.push({
        kind: "passive",
        category_id: job.categoryId,
        youtube_channel_id: channel.id,
        title: channel.title,
        thumbnail_url: channel.thumbnailUrl,
      });
    }
  }

  if (rows.length) {
    const { error } = await supabase.from("default_channels").insert(rows);
    if (error)
      return { error: error.message, categoriesCreated: missing.length };
  }

  revalidate();
  return { categoriesCreated: missing.length, added: rows.length, skipped };
}
