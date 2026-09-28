"use client";

import { useRef, useState } from "react";
import { FaSliders, FaXmark } from "react-icons/fa6";
import CategoryPicker, { type Category } from "@/app/components/CategoryPicker";

// Once the user has picked categories, the picker moves into this dialog.
export default function UpdateCategoriesButton({
  categories,
  picked,
}: {
  categories: Category[];
  picked: string[];
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Remounts the picker on each open, so unsaved picks don't linger.
  const [openCount, setOpenCount] = useState(0);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpenCount((n) => n + 1);
          dialogRef.current?.showModal();
        }}
        className="btn-ghost shrink-0"
      >
        <FaSliders />
        Update category
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby="categories-title"
        className="card m-auto w-[calc(100%-2rem)] max-w-md text-foreground backdrop:bg-black/50"
      >
        <div className="mb-1 flex items-start justify-between gap-4">
          <h2 id="categories-title" className="text-xl font-semibold">
            Categories
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="rounded-lg p-1 text-muted hover:text-foreground"
          >
            <FaXmark />
          </button>
        </div>
        <p className="mb-4 text-sm text-muted">
          You get the recommended channels from the categories you pick.
        </p>
        <CategoryPicker
          key={openCount}
          categories={categories}
          initial={picked}
          onSaved={() => dialogRef.current?.close()}
        />
      </dialog>
    </>
  );
}
