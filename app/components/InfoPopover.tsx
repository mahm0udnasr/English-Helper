"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { FaCircleInfo } from "react-icons/fa6";

const AUTO_CLOSE_MS = 5000;
const EDGE_MARGIN = 12; // px kept between the tooltip and the screen edge

// Info button that shows `text` in a small tooltip under it. It closes on any
// tap/click elsewhere (including other buttons), on Escape, or after 5 seconds.
export default function InfoPopover({
  label,
  text,
  className = "",
}: {
  label: string;
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);
  const tooltipId = useId();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const timer = setTimeout(close, AUTO_CLOSE_MS);
    const onPointerDown = (e: PointerEvent) => {
      // The info button toggles itself; everything else closes the tooltip.
      if (!buttonRef.current?.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Centered under the icon, then nudged sideways to stay on screen.
  // The arrow stays under the icon.
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!open || !el) return;
    el.style.setProperty("--shift", "0px");
    const rect = el.getBoundingClientRect();
    const maxRight = window.innerWidth - EDGE_MARGIN;
    const shift =
      rect.left < EDGE_MARGIN
        ? EDGE_MARGIN - rect.left
        : rect.right > maxRight
          ? maxRight - rect.right
          : 0;
    el.style.setProperty("--shift", `${shift}px`);
  }, [open]);

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-describedby={open ? tooltipId : undefined}
        aria-label={label}
        className={`rounded-full p-1 transition-colors ${
          open ? "text-accent" : "text-muted hover:text-foreground"
        }`}
      >
        <FaCircleInfo />
      </button>
      {open && (
        <>
          <span
            aria-hidden
            className="absolute top-full left-1/2 z-40 mt-[3px] size-2.5 -translate-x-1/2 rotate-45 rounded-tl-[2px] border-t border-l border-border bg-surface"
          />
          <span
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            style={{ transform: "translateX(calc(-50% + var(--shift, 0px)))" }}
            className="absolute top-full left-1/2 z-30 mt-2 w-max max-w-60 rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed font-normal text-foreground shadow-lg"
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
