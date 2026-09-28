"use client";

import { useState } from "react";

export default function ChannelAvatar({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
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
