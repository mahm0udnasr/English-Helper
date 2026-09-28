"use client";

import { useSearchParams } from "next/navigation";
import type { ReactNode } from "react";

// Tabs kept in a URL search param (so reloads and shared links keep the tab)
// but switched in the browser: every panel is already rendered, and
// pushState updates useSearchParams without a server round trip.

function useActiveTab(param: string, values: readonly string[]) {
  const value = useSearchParams().get(param);
  return value && values.includes(value) ? value : values[0];
}

export function TabLinks({
  param,
  tabs,
}: {
  param: string;
  tabs: { value: string; label: string; icon?: ReactNode }[];
}) {
  const searchParams = useSearchParams();
  const active = useActiveTab(
    param,
    tabs.map((t) => t.value),
  );

  const select = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, value);
    window.history.pushState(null, "", `?${params}`);
  };

  return (
    <div
      role="tablist"
      className="flex rounded-lg border border-border bg-surface p-1"
    >
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={t.value === active}
          onClick={() => select(t.value)}
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm whitespace-nowrap transition-colors sm:px-4 ${
            t.value === active
              ? "bg-accent text-accent-foreground"
              : "text-muted hover:text-foreground"
          }`}
        >
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Hidden rather than unmounted, so e.g. an expanded list stays expanded.
export function TabPanel({
  param,
  value,
  values,
  children,
}: {
  param: string;
  value: string;
  values: readonly string[];
  children: ReactNode;
}) {
  const active = useActiveTab(param, values);
  return (
    <div role="tabpanel" hidden={active !== value}>
      {children}
    </div>
  );
}
