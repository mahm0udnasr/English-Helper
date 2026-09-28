"use client";

import { useState, type ReactNode } from "react";
import { FaChevronDown } from "react-icons/fa6";

// A channel grid showing the first `visible` items, with a toggle for the rest.
export default function CollapsibleList({
  items,
  visible = 2,
}: {
  items: ReactNode[];
  visible?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = items.length - visible;

  return (
    <div className="flex flex-col gap-3">
      <ul className="grid gap-3 sm:grid-cols-2">
        {expanded ? items : items.slice(0, visible)}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="flex items-center gap-1.5 self-center text-sm text-accent hover:underline"
        >
          {expanded ? "See less" : `See ${hiddenCount} more`}
          <FaChevronDown
            className={`text-xs transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </button>
      )}
    </div>
  );
}
