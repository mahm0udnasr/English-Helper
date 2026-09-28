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
  // The arrow stays under the icon. Positioned with `left` rather than a
  // transform: phones size the page to the untransformed box, so a
  // translated tooltip still made the page scroll sideways.
  useLayoutEffect(() => {
    const el = tooltipRef.current;
    if (!open || !el) return;
    const anchor = el.parentElement!.getBoundingClientRect();
    const width = el.offsetWidth;
    const maxLeft = document.documentElement.clientWidth - EDGE_MARGIN - width;
    const centered = anchor.left + anchor.width / 2 - width / 2;
    const left = Math.max(EDGE_MARGIN, Math.min(centered, maxLeft));
    el.style.left = `${left - anchor.left}px`;
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
            className="absolute top-full left-0 z-30 mt-2 w-max max-w-[min(15rem,calc(100vw-24px))] rounded-lg border border-border bg-surface px-3 py-2 text-xs leading-relaxed font-normal text-foreground shadow-lg"
          >
            {text}
          </span>
        </>
      )}
    </span>
  );
}
