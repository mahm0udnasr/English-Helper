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
  // Undocumented, but the standard way to turn the player's captions off
  // and back on.
  unloadModule(name: "captions"): void;
  loadModule(name: "captions"): void;
  setOption(
    module: "captions",
    option: "track",
    value: { languageCode: string },
  ): void;
};
type YTNamespace = {
  Player: new (
    el: HTMLIFrameElement,
    opts: {
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
};
const PLAYING = 1;
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function showEnglishCaptions(player: YTPlayer) {
  player.loadModule("captions");
  player.setOption("captions", "track", { languageCode: "en" });
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
  // Set when our transcript can't load: the player's own captions come back
  // instead, since they load from the viewer's device, which YouTube allows.
  const playerCaptionsOn = useRef(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Attach the API to the embed so the transcript can follow and seek it.
  // The player's own captions are turned off since the transcript shows
  // them; cc_load_policy=0 alone doesn't override the viewer's YouTube
  // preference, and the captions module reloads when playback starts.
  useEffect(() => {
    let cancelled = false;
    let instance: YTPlayer | undefined;
    const syncCaptions = () => {
      if (playerCaptionsOn.current) showEnglishCaptions(instance!);
      else instance!.unloadModule("captions");
    };
    loadYouTubeApi().then((YT) => {
      if (cancelled || !iframeRef.current) return;
      instance = new YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            syncCaptions();
            if (!cancelled) setPlayer(instance!);
          },
          onStateChange: (e) => {
            if (e.data === PLAYING) syncCaptions();
          },
        },
      });
    });
    return () => {
      cancelled = true;
      setPlayer(null);
    };
  }, [videoId]);

  // Phones stay upright when the player goes fullscreen, so turn the screen
  // sideways while it is. Android supports this; iOS and desktops don't have
  // lock() (or reject it) and just keep their usual behavior.
  useEffect(() => {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: "landscape") => Promise<void>;
    };
    const onFullscreenChange = () => {
      if (document.fullscreenElement === iframeRef.current)
        orientation.lock?.("landscape").catch(() => {});
      else orientation.unlock?.();
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm sm:p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        // Full screen on phones (clear of the notch and home bar); a centered
        // card from sm up.
        className="flex h-dvh w-full flex-col overflow-hidden bg-surface pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] sm:h-auto sm:max-h-full sm:max-w-4xl sm:rounded-2xl sm:border sm:border-border sm:py-0 sm:shadow-2xl"
      >
        <div className="aspect-video shrink-0 bg-black">
          <iframe
            ref={iframeRef}
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1&cc_load_policy=0`}
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
          <Transcript
            key={videoId}
            videoId={videoId}
            player={player}
            onUnavailable={() => {
              playerCaptionsOn.current = true;
              if (player) showEnglishCaptions(player);
            }}
          />
        )}
      </div>
    </div>
  );
}
