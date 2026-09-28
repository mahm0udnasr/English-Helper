"use client";

import { useOptimistic, useState, useTransition } from "react";
import Switch from "@/app/components/Switch";
import { setShowDefaults } from "./actions";

const ROWS = [
  {
    kind: "active",
    label: "Recommended active channels",
    hint: "Videos from our picked active channels on Home.",
  },
  {
    kind: "passive",
    label: "Recommended passive channels",
    hint: "Videos from the categories you picked on Home.",
  },
] as const;

// Off means Home only shows videos from the channels the user added.
export default function RecommendedSettings({
  active,
  passive,
}: {
  active: boolean;
  passive: boolean;
}) {
  return (
    <ul className="flex flex-col divide-y divide-border">
      {ROWS.map((row) => (
        <Row
          key={row.kind}
          {...row}
          on={row.kind === "active" ? active : passive}
        />
      ))}
    </ul>
  );
}

function Row({
  kind,
  label,
  hint,
  on,
}: {
  kind: "active" | "passive";
  label: string;
  hint: string;
  on: boolean;
}) {
  const [optimisticOn, setOptimisticOn] = useOptimistic(on);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const toggle = () =>
    startTransition(async () => {
      setOptimisticOn(!optimisticOn);
      const result = await setShowDefaults(kind, !optimisticOn);
      setError(result.error);
    });

  return (
    <li className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
      <div className="text-sm">
        <p>{label}</p>
        <p className="text-xs text-muted">{hint}</p>
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
      <Switch on={optimisticOn} onToggle={toggle} label={label} />
    </li>
  );
}
