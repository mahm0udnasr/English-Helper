"use client";

import { useState, useTransition } from "react";
import { FaCheck } from "react-icons/fa6";
import { saveCategories } from "@/app/actions/categories";

export type Category = { id: string; name: string };

// Toggle chips for the passive categories, saved together. Save stays
// disabled until at least one is picked and something changed.
export default function CategoryPicker({
  categories,
  initial,
  saveLabel = "Save",
  onSaved,
}: {
  categories: Category[];
  initial: string[];
  saveLabel?: string;
  onSaved?: () => void;
}) {
  const [selected, setSelected] = useState(() => new Set(initial));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  const changed =
    selected.size !== initial.length || initial.some((id) => !selected.has(id));

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (!next.delete(id)) next.add(id);
      return next;
    });

  const save = () =>
    startTransition(async () => {
      const result = await saveCategories([...selected]);
      setError(result.error);
      if (!result.error) onSaved?.();
    });

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const on = selected.has(c.id);
          return (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => toggle(c.id)}
                aria-pressed={on}
                className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  on
                    ? "border-accent bg-accent/10 font-medium text-accent"
                    : "border-border text-muted hover:text-foreground"
                }`}
              >
                {on && <FaCheck className="text-xs" />}
                {c.name}
              </button>
            </li>
          );
        })}
      </ul>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div>
        <button
          type="button"
          onClick={save}
          disabled={pending || selected.size === 0 || !changed}
          className="btn-primary"
        >
          {pending ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
