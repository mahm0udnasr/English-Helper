"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ComponentType,
} from "react";
import { FaEllipsisVertical } from "react-icons/fa6";

export type ActionResult = { error?: string };

export type MenuItem = {
  label: string;
  icon: ComponentType;
  danger?: boolean;
  // Return undefined to cancel (e.g. the user dismissed a confirm()).
  onSelect: () => Promise<ActionResult> | undefined;
};

// "⋮" button with a dropdown of actions, showing the error of the last one.
// The menu is fixed to the viewport so a table's scroll container doesn't
// clip it; it closes on scroll or resize rather than following the button.
export default function ActionMenu({
  label,
  items,
}: {
  label: string;
  items: MenuItem[];
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();
  const [menuPos, setMenuPos] = useState<{ top: number; right: number }>();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const open = menuPos !== undefined;

  useEffect(() => {
    if (!open) return;
    const close = () => setMenuPos(undefined);
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      )
        close();
    };
    const onKeyDown = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  const toggle = () => {
    const rect = buttonRef.current?.getBoundingClientRect();
    setMenuPos(
      open || !rect
        ? undefined
        : { top: rect.bottom + 4, right: window.innerWidth - rect.right },
    );
  };

  const select = (item: MenuItem) => {
    setMenuPos(undefined);
    const promise = item.onSelect();
    if (!promise) return;
    startTransition(async () => {
      const result = await promise;
      setError(result.error);
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-label={`Actions for ${label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
          open
            ? "bg-foreground/5 text-foreground"
            : "text-muted hover:bg-foreground/5 hover:text-foreground"
        }`}
      >
        <FaEllipsisVertical />
      </button>
      {open && (
        <div
          ref={menuRef}
          role="menu"
          style={menuPos}
          className="fixed z-50 w-40 rounded-lg border border-border bg-surface p-1 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => select(item)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/5 ${
                item.danger ? "text-red-500" : ""
              }`}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
