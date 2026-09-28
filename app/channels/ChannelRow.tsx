"use client";

import { useState, useTransition } from "react";
import { FaArrowsRotate, FaTrash } from "react-icons/fa6";
import type { Tables } from "@/lib/database.types";
import ChannelAvatar from "@/app/components/ChannelAvatar";
import { removeChannel, syncChannel } from "./actions";

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
