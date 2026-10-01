"use client";

import { useOptimistic, useState, useTransition } from "react";
import Switch from "@/app/components/Switch";
import { setTranscriptsEnabled } from "./actions";

export default function TranscriptsSwitch({ on }: { on: boolean }) {
  const [optimisticOn, setOptimisticOn] = useOptimistic(on);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const toggle = () =>
    startTransition(async () => {
      setOptimisticOn(!optimisticOn);
      const result = await setTranscriptsEnabled(!optimisticOn);
      setError(result.error);
    });

  return (
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm">
        <p className="font-medium">Subtitles under the player</p>
        <p className="text-xs text-muted">
          For all users. Off hides them and shows YouTube&apos;s own captions in
          the player instead.
        </p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <Switch
        on={optimisticOn}
        onToggle={toggle}
        label="Subtitles under the player"
      />
    </div>
  );
}
