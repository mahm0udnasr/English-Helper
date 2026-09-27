"use client";

import { useState, useTransition } from "react";
import { FaArrowsRotate, FaTrash } from "react-icons/fa6";
import type { Tables } from "@/lib/database.types";
import { removeChannel, syncChannel } from "./actions";

function ChannelAvatar({ src, title }: { src: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent/15 text-lg font-semibold text-accent">
        {title.trim().charAt(0).toUpperCase() || "?"}
      </div>
    );
  }
  return (
    // YouTube's image CDN rejects hotlinked avatars that send a Referer.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="size-12 shrink-0 rounded-full bg-border object-cover"
    />
  );
}

export default function ChannelRow({
  channel,
}: {
  channel: Tables<"channels">;
}) {
  const [syncing, startSync] = useTransition();
  const [deleting, startDelete] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function sync() {
    setError(null);
    startSync(async () => {
      const result = await syncChannel(channel.id);
      if (result?.error) setError(result.error);
    });
  }

  function remove() {
    if (
      !confirm(`Remove "${channel.title}" from your ${channel.kind} channels?`)
    )
      return;
    startDelete(() => removeChannel(channel.id));
  }

  return (
    <li
      className={`card flex items-center gap-4 p-4 transition-opacity ${deleting ? "opacity-50" : ""}`}
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
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={sync}
          disabled={syncing || deleting}
          title="Sync: refresh name, photo and latest videos"
          aria-label={`Sync ${channel.title}`}
          className="btn-ghost border-transparent text-muted hover:text-accent"
        >
          <FaArrowsRotate className={syncing ? "animate-spin" : ""} />
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={syncing || deleting}
          title="Delete channel"
          aria-label={`Delete ${channel.title}`}
          className="btn-ghost border-transparent text-muted hover:text-red-500"
        >
          <FaTrash />
        </button>
      </div>
    </li>
  );
}
