"use client";

import { useOptimistic, useState, useTransition } from "react";
import ChannelAvatar from "@/app/components/ChannelAvatar";
import { setDefaultChannelHidden } from "./actions";

// One of the admin's default channels, with a switch to show or hide its
// videos on Home.
export default function RecommendedChannel({
  channel,
  hidden,
  category,
}: {
  channel: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    youtube_channel_id: string;
  };
  hidden: boolean;
  category?: string;
}) {
  const [optimisticHidden, setOptimisticHidden] = useOptimistic(hidden);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const on = !optimisticHidden;

  const toggle = () =>
    startTransition(async () => {
      setOptimisticHidden(on);
      const result = await setDefaultChannelHidden(channel.id, on);
      setError(result.error);
    });

  return (
    <li
      className={`card flex items-center gap-4 p-4 transition-opacity ${on ? "" : "opacity-60"}`}
    >
      <ChannelAvatar
        key={channel.thumbnail_url}
        src={channel.thumbnail_url}
        title={channel.title}
      />
      <div className="min-w-0 flex-1">
        <a
          href={`https://www.youtube.com/channel/${channel.youtube_channel_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-1 font-semibold hover:underline"
        >
          {channel.title}
        </a>
        {category && <p className="text-xs text-muted">{category}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label={`Show videos from ${channel.title}`}
        onClick={toggle}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          on ? "bg-accent" : "bg-border"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${
            on ? "translate-x-5" : ""
          }`}
        />
      </button>
    </li>
  );
}
