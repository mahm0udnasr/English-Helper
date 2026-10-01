import Link from "next/link";
import type { ExtraVideo } from "@/app/actions/tasks";
import { getAppSettings } from "@/lib/app-settings";
import { getWatchChannels } from "@/lib/channels";
import { shuffled } from "@/lib/playlist";
import { createClient } from "@/lib/supabase/server";
import { getLatestVideos } from "@/lib/youtube";
import VideoPicks, { type PickVideo } from "./VideoPicks";

// Pool of recent (≥ 4 min) videos from the user's channels of this kind
// (their own plus the admin defaults), shuffled on every visit (the playlist
// is built from it). getLatestVideos is cached, so this is cheap.
async function getVideoPool(
  kind: "active" | "passive",
  includeDefaults: boolean,
): Promise<{ channelCount: number; pool: PickVideo[] }> {
  const supabase = await createClient();
  const channels = await getWatchChannels(supabase, kind, includeDefaults);

  const perChannel = await Promise.all(
    channels.map(async (c) => {
      const videos = await getLatestVideos(c.youtube_channel_id, 50).catch(
        () => [],
      );
      return videos.map((v) => ({ ...v, channelTitle: c.title }));
    }),
  );
  return {
    channelCount: channels.length,
    pool: shuffled(perChannel.flat()),
  };
}

export default async function HomeVideos({
  kind,
  goalMin,
  done,
  extras,
  showDefaults,
}: {
  kind: "active" | "passive";
  goalMin: number;
  done: boolean;
  extras: ExtraVideo[];
  showDefaults: boolean;
}) {
  if (!process.env.YOUTUBE_API_KEY) {
    return (
      <p className="text-xs text-muted">
        Add YOUTUBE_API_KEY to .env.local to see videos here.
      </p>
    );
  }

  const [{ channelCount, pool }, appSettings] = await Promise.all([
    getVideoPool(kind, showDefaults),
    createClient().then(getAppSettings),
  ]);
  if (channelCount === 0) {
    return (
      <p className="text-sm text-muted">
        No {kind} channels yet.{" "}
        <Link
          href={`/channels?kind=${kind}`}
          className="text-accent hover:underline"
        >
          Add a {kind} channel
        </Link>
      </p>
    );
  }
  if (pool.length === 0) {
    return (
      <p className="text-sm text-muted">
        No recent videos longer than 4 minutes.
      </p>
    );
  }

  return (
    <VideoPicks
      kind={kind}
      pool={pool}
      goalMin={goalMin}
      done={done}
      extras={extras}
      transcripts={appSettings.transcripts_enabled}
    />
  );
}
