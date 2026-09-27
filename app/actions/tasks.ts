"use server";

import { revalidatePath } from "next/cache";
import { getSettings } from "@/lib/supabase/server";
import { todayIn } from "@/lib/today";

export type TaskKind = "anki" | "active" | "passive";

export async function setTaskDone(kind: TaskKind, done: boolean) {
  if (!["anki", "active", "passive"].includes(kind)) return;

  const { supabase, user, settings } = await getSettings();
  const day = todayIn(settings.timezone);

  if (done) {
    const minutes =
      kind === "active"
        ? settings.active_goal_min
        : kind === "passive"
          ? settings.passive_goal_min
          : 0;
    await supabase
      .from("daily_tasks")
      .upsert({ user_id: user.id, day, kind, minutes });
  } else {
    await supabase
      .from("daily_tasks")
      .delete()
      .eq("user_id", user.id)
      .eq("day", day)
      .eq("kind", kind);
  }

  revalidatePath("/");
  revalidatePath("/settings");
}

export type ExtraVideo = {
  id: string;
  title: string;
  channelTitle: string;
  minutes: number;
};

// Log a video watched beyond today's target; its minutes count toward totals.
export async function logExtraVideo(
  kind: "active" | "passive",
  video: ExtraVideo,
) {
  if (kind !== "active" && kind !== "passive") return;
  const minutes = Math.round(video.minutes);
  if (!(minutes >= 1 && minutes <= 600)) return;

  const { supabase, user, settings } = await getSettings();
  await supabase.from("extra_study").upsert({
    user_id: user.id,
    day: todayIn(settings.timezone),
    kind,
    video_id: video.id,
    title: video.title.slice(0, 300),
    channel_title: video.channelTitle.slice(0, 200),
    minutes,
  });

  revalidatePath("/");
  revalidatePath("/settings");
}

export async function removeExtraVideo(
  kind: "active" | "passive",
  videoId: string,
) {
  const { supabase, user, settings } = await getSettings();
  await supabase
    .from("extra_study")
    .delete()
    .eq("user_id", user.id)
    .eq("day", todayIn(settings.timezone))
    .eq("kind", kind)
    .eq("video_id", videoId);

  revalidatePath("/");
  revalidatePath("/settings");
}
