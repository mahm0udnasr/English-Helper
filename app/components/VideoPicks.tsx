"use client";

import { useState, useTransition } from "react";
import { FaCheck, FaPlus, FaRotateLeft, FaShuffle } from "react-icons/fa6";
import {
  logExtraVideo,
  removeExtraVideo,
  type ExtraVideo,
} from "@/app/actions/tasks";
import { formatDuration } from "@/lib/format";
import { buildPlaylist, shuffled, videoMinutes } from "@/lib/playlist";
import type { YouTubeVideo } from "@/lib/youtube";
import VideoModal from "./VideoModal";

export type PickVideo = YouTubeVideo & { channelTitle: string };

type Props = {
  kind: "active" | "passive";
  // Already shuffled on the server, so the first render matches on the client.
  pool: PickVideo[];
  goalMin: number;
  done: boolean;
  // Extra videos already logged today.
  extras: ExtraVideo[];
  // Whether the admin has our subtitles on (see VideoModal).
  transcripts: boolean;
};

const totalMin = (videos: PickVideo[]) =>
  Math.round(videos.reduce((s, v) => s + v.durationSec, 0) / 60);

// Logged extras only have what we stored; rebuild enough to show and play them.
const fromExtra = (e: ExtraVideo): PickVideo => ({
  id: e.id,
  title: e.title,
  channelTitle: e.channelTitle,
  durationSec: e.minutes * 60,
  thumbnailUrl: `https://i.ytimg.com/vi/${e.id}/mqdefault.jpg`,
  publishedAt: "",
});

export default function VideoPicks({
  kind,
  pool,
  goalMin,
  done,
  extras,
  transcripts,
}: Props) {
  const [playlist, setPlaylist] = useState(() => buildPlaylist(pool, goalMin));
  const [added, setAdded] = useState<PickVideo[]>([]);
  const [playing, setPlaying] = useState<PickVideo | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loggedIds = new Set(extras.map((e) => e.id));
  const extraMin = extras.reduce((s, e) => s + e.minutes, 0);
  const extraList = [
    ...extras.map(fromExtra),
    ...added.filter((v) => !loggedIds.has(v.id)),
  ];

  const used = new Set([
    ...playlist.map((v) => v.id),
    ...added.map((v) => v.id),
    ...loggedIds,
  ]);
  const candidates = pool.filter((v) => !used.has(v.id));

  function reshuffle() {
    setPlaylist(buildPlaylist(shuffled(pool), goalMin));
  }

  function addVideo() {
    const [next] = shuffled(candidates);
    if (next) setAdded((a) => [...a, next]);
  }

  function toggleLogged(video: PickVideo) {
    const logged = loggedIds.has(video.id);
    setPendingId(video.id);
    startTransition(async () => {
      if (logged) {
        await removeExtraVideo(kind, video.id);
        // Keep it in the list so it can be re-marked.
        setAdded((a) => (a.some((v) => v.id === video.id) ? a : [...a, video]));
      } else {
        await logExtraVideo(kind, {
          id: video.id,
          title: video.title,
          channelTitle: video.channelTitle,
          minutes: videoMinutes(video),
        });
      }
      setPendingId(null);
    });
  }

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-medium tracking-wide text-muted uppercase">
            Today&apos;s playlist · {totalMin(playlist)} min
            <span className="normal-case"> (target {goalMin} min)</span>
          </span>
          {pool.length > playlist.length && (
            <button
              type="button"
              onClick={reshuffle}
              className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
            >
              <FaShuffle /> Shuffle
            </button>
          )}
        </div>
        {totalMin(playlist) < goalMin && (
          <p className="text-xs text-muted">
            Not enough videos to fill your target. Add more channels.
          </p>
        )}
        <VideoTiles videos={playlist} onPlay={setPlaying} />
      </section>

      {done && (
        <section className="flex flex-col gap-3 rounded-xl border border-dashed border-done/50 p-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm">
              <strong className="text-done">Target reached!</strong>{" "}
              <span className="text-muted">
                {extraMin > 0
                  ? `+${extraMin} min extra today`
                  : "Want to keep going?"}
              </span>
            </span>
            <button
              type="button"
              onClick={addVideo}
              disabled={candidates.length === 0}
              className="btn-ghost"
            >
              <FaPlus /> Add video
            </button>
          </div>
          {extraList.length > 0 && (
            <VideoTiles
              videos={extraList}
              onPlay={setPlaying}
              renderAction={(video) => {
                const logged = loggedIds.has(video.id);
                return (
                  <button
                    type="button"
                    onClick={() => toggleLogged(video)}
                    disabled={pendingId === video.id}
                    title={logged ? "Undo" : undefined}
                    className={`mt-1.5 flex items-center gap-1.5 self-start rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
                      logged
                        ? "bg-done/15 text-done hover:bg-done/25"
                        : "bg-accent/10 text-accent hover:bg-accent/20"
                    }`}
                  >
                    {logged ? (
                      <>
                        <FaCheck /> Watched +{videoMinutes(video)} min
                        <FaRotateLeft className="ml-1 opacity-60" />
                      </>
                    ) : (
                      <>Mark watched · +{videoMinutes(video)} min</>
                    )}
                  </button>
                );
              }}
            />
          )}
        </section>
      )}

      {playing && (
        <VideoModal
          videoId={playing.id}
          title={playing.title}
          subtitle={playing.channelTitle}
          transcripts={transcripts}
          onClose={() => setPlaying(null)}
        />
      )}
    </div>
  );
}

function VideoTiles({
  videos,
  onPlay,
  renderAction,
}: {
  videos: PickVideo[];
  onPlay: (v: PickVideo) => void;
  renderAction?: (v: PickVideo) => React.ReactNode;
}) {
  return (
    <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {videos.map((video) => (
        <li key={video.id} className="flex flex-col">
          <button
            type="button"
            onClick={() => onPlay(video)}
            className="group flex w-full flex-col gap-2 text-left"
          >
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-border">
              {video.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={video.thumbnailUrl}
                  alt=""
                  loading="lazy"
                  className="size-full object-cover transition-transform group-hover:scale-105"
                />
              )}
              <span className="absolute right-1.5 bottom-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                {formatDuration(video.durationSec)}
              </span>
            </div>
            <div className="min-w-0">
              <p className="line-clamp-2 text-sm leading-snug group-hover:text-accent">
                {video.title}
              </p>
              <p className="mt-0.5 line-clamp-1 text-xs text-muted">
                {video.channelTitle}
              </p>
            </div>
          </button>
          {renderAction?.(video)}
        </li>
      ))}
    </ul>
  );
}
