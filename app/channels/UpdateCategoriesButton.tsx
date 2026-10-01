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
        // Fits the screen: only the chips scroll, with the heading and the
        // button staying in view.
        className="card m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md flex-col p-5 text-foreground backdrop:bg-black/50 open:flex sm:p-6"
      >
        <div className="mb-1 flex shrink-0 items-start justify-between gap-4">
          <h2 id="categories-title" className="text-lg font-semibold sm:text-xl">
            Categories
          </h2>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="-m-1 rounded-lg p-2 text-muted hover:text-foreground"
          >
            <FaXmark />
          </button>
        </div>
        <p className="mb-4 shrink-0 text-sm text-muted">
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
