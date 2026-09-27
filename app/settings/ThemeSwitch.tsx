"use client";

import { useSyncExternalStore } from "react";
import { FaDesktop, FaMoon, FaSun } from "react-icons/fa6";
import { getTheme, setTheme, subscribeTheme, type Theme } from "@/lib/theme";

const OPTIONS = [
  { value: "system", label: "Device", icon: FaDesktop },
  { value: "light", label: "Light", icon: FaSun },
  { value: "dark", label: "Dark", icon: FaMoon },
] as const satisfies readonly { value: Theme; label: string; icon: unknown }[];

export default function ThemeSwitch() {
  // null on the server: nothing is highlighted until the client knows.
  const theme = useSyncExternalStore(subscribeTheme, getTheme, () => null);

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-lg border border-border bg-background p-1"
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => {
        const selected = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setTheme(value)}
            className={`flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
              selected
                ? "bg-surface font-medium text-accent shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <Icon />
            {label}
          </button>
        );
      })}
    </div>
  );
}
