"use client";

import { useEffect, useRef, useState } from "react";
import { FaClosedCaptioning, FaXmark } from "react-icons/fa6";
import Transcript from "./Transcript";

type Props = {
  videoId: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
};

// The slice of the YouTube IFrame Player API used here.
export type YTPlayer = {
  getCurrentTime(): number;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  playVideo(): void;
  destroy(): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLIFrameElement,
    opts: { events: { onReady: () => void } },
  ) => YTPlayer;
};
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | undefined;
function loadYouTubeApi() {
  apiPromise ??= new Promise((resolve) => {
    if (window.YT?.Player) return resolve(window.YT);
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);
  });
  return apiPromise;
}

export default function VideoModal({
  videoId,
  title,
  subtitle,
  onClose,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [player, setPlayer] = useState<YTPlayer | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Attach the API to the embed so the transcript can follow and seek it.
  useEffect(() => {
    let cancelled = false;
    let instance: YTPlayer | undefined;
    loadYouTubeApi().then((YT) => {
      if (cancelled || !iframeRef.current) return;
      instance = new YT.Player(iframeRef.current, {
        events: { onReady: () => !cancelled && setPlayer(instance!) },
      });
    });
    return () => {
      cancelled = true;
      setPlayer(null);
    };
  }, [videoId]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
      >
        <div className="aspect-video shrink-0 bg-black">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`}
            title={title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
            className="size-full"
          />
        </div>
        <div className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="line-clamp-1 font-medium">{title}</p>
            {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setShowTranscript((v) => !v)}
              aria-pressed={showTranscript}
              aria-label={showTranscript ? "Hide subtitles" : "Show subtitles"}
              title={showTranscript ? "Hide subtitles" : "Show subtitles"}
              className={`btn-ghost ${showTranscript ? "text-accent" : ""}`}
            >
              <FaClosedCaptioning />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
              aria-label="Close player"
            >
              <FaXmark />
            </button>
          </div>
        </div>
        {showTranscript && (
          <Transcript key={videoId} videoId={videoId} player={player} />
        )}
      </div>
    </div>
  );
}
