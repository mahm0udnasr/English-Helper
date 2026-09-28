"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  FaBan,
  FaEllipsisVertical,
  FaLockOpen,
  FaTrash,
} from "react-icons/fa6";
import { deleteUser, setUserBlocked } from "./actions";

// "⋮" button with a Block/Delete menu. The menu is fixed to the viewport so
// the table's scroll container doesn't clip it; it closes on scroll or resize
// rather than following the button.
export default function UserActions({
  userId,
  label,
  blocked,
}: {
  userId: string;
  label: string;
  blocked: boolean;
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

  const run = (action: () => Promise<{ error?: string }>) => {
    setMenuPos(undefined);
    startTransition(async () => {
      const result = await action();
      setError(result.error);
    });
  };

  const itemClass =
    "flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-foreground/5";

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
          <button
            type="button"
            role="menuitem"
            onClick={() => run(() => setUserBlocked(userId, !blocked))}
            className={itemClass}
          >
            {blocked ? <FaLockOpen /> : <FaBan />}
            {blocked ? "Unblock" : "Block"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              if (
                confirm(
                  `Delete ${label}? Their progress and settings are removed too. This can't be undone.`,
                )
              )
                run(() => deleteUser(userId));
              else setMenuPos(undefined);
            }}
            className={`${itemClass} text-red-500`}
          >
            <FaTrash />
            Delete
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
