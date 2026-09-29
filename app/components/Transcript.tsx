"use client";

import { useEffect, useRef, useState } from "react";
import type { YTPlayer } from "./VideoModal";

type Cue = { start: number; end: number; text: string };
type State =
  | { status: "loading" }
  | { status: "error" }
  | { status: "none" }
  | { status: "ready"; cues: Cue[] };

const POLL_MS = 250;
// After the user scrolls the transcript themselves, leave it alone this long.
const MANUAL_SCROLL_PAUSE_MS = 4000;

// Index of the last cue that has started by `time`, or -1 before the first.
function cueAt(cues: Cue[], time: number) {
  let lo = 0;
  let hi = cues.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (cues[mid].start <= time) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

// The video's English subtitles under the player. The current line is
// highlighted and kept in view; tapping a line jumps the video there.
// Render it with key={videoId} so a new video starts from a clean state.
export default function Transcript({
  videoId,
  player,
}: {
  videoId: string;
  player: YTPlayer | null;
}) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [active, setActive] = useState(-1);
  const listRef = useRef<HTMLOListElement>(null);
  const manualScrollAt = useRef(0);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/captions/${videoId}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(({ cues }: { cues: Cue[] | null }) => {
        if (cancelled) return;
        setState(cues?.length ? { status: "ready", cues } : { status: "none" });
      })
      .catch(() => !cancelled && setState({ status: "error" }));
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  const cues = state.status === "ready" ? state.cues : null;

  useEffect(() => {
    if (!player || !cues) return;
    const timer = setInterval(() => {
      setActive(cueAt(cues, player.getCurrentTime()));
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [player, cues]);

  // Scroll the list itself (not the page) so the active line sits mid-panel.
  useEffect(() => {
    const list = listRef.current;
    const line = list?.children[active] as HTMLElement | undefined;
    if (!list || !line) return;
    if (Date.now() - manualScrollAt.current < MANUAL_SCROLL_PAUSE_MS) return;
    list.scrollTo({
      top: line.offsetTop - list.clientHeight / 2 + line.clientHeight / 2,
      behavior: "smooth",
    });
  }, [active]);

  const markManualScroll = () => {
    manualScrollAt.current = Date.now();
  };

  if (state.status !== "ready") {
    return (
      <p className="border-t border-border px-4 py-6 text-center text-sm text-muted">
        {state.status === "loading"
          ? "Loading subtitles…"
          : state.status === "none"
            ? "This video has no English subtitles."
            : "Couldn't load subtitles."}
      </p>
    );
  }

  return (
    <ol
      ref={listRef}
      onWheel={markManualScroll}
      onTouchMove={markManualScroll}
      aria-label="Subtitles"
      className="relative min-h-24 flex-1 overflow-y-auto overscroll-contain border-t border-border px-2 py-2 sm:h-48 sm:flex-none sm:shrink"
    >
      {state.cues.map((cue, i) => (
        <li key={i}>
          <button
            type="button"
            onClick={() => {
              manualScrollAt.current = 0;
              player?.seekTo(cue.start, true);
              player?.playVideo();
              setActive(i);
            }}
            aria-current={i === active ? "true" : undefined}
            className={`w-full rounded-lg px-3 py-1.5 text-left transition-colors ${
              i === active
                ? "bg-accent/10 font-medium text-foreground"
                : "text-muted hover:bg-foreground/5 hover:text-foreground"
            }`}
          >
            {cue.text}
          </button>
        </li>
      ))}
    </ol>
  );
}
