"use client";

import { useOptimistic, useState, useTransition } from "react";
import Switch from "@/app/components/Switch";
import { setDefaultChannelEnabled } from "./actions";

// Shows or hides a default channel for every user.
export default function DefaultChannelSwitch({
  id,
  title,
  enabled,
}: {
  id: string;
  title: string;
  enabled: boolean;
}) {
  const [optimisticOn, setOptimisticOn] = useOptimistic(enabled);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const toggle = () =>
    startTransition(async () => {
      setOptimisticOn(!optimisticOn);
      const result = await setDefaultChannelEnabled(id, !optimisticOn);
      setError(result.error);
    });

  return (
    <>
      {error && <span className="text-xs text-red-500">{error}</span>}
      <Switch
        on={optimisticOn}
        onToggle={toggle}
        label={`Show "${title}" to users`}
      />
    </>
  );
}
