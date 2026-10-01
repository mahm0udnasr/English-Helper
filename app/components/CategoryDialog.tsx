"use client";

import { useEffect, useRef } from "react";
import { FaHeadphones } from "react-icons/fa6";
import CategoryPicker, { type Category } from "./CategoryPicker";

// Shown on Home until the user picks at least one passive category. It can't
// be dismissed; saving revalidates Home, which then stops rendering it.
export default function CategoryDialog({
  categories,
}: {
  categories: Category[];
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      // Block Escape; backdrop clicks don't close a modal <dialog> by default.
      onCancel={(e) => e.preventDefault()}
      aria-labelledby="category-dialog-title"
      // Fits the screen: only the chips scroll, with the heading and the
      // button staying in view.
      className="card m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md flex-col p-5 text-foreground backdrop:bg-black/50 open:flex sm:p-6"
    >
      <div className="mb-4 flex shrink-0 flex-col items-center gap-1.5 text-center sm:mb-5 sm:gap-2">
        <FaHeadphones className="text-2xl text-accent sm:text-3xl" />
        <h2
          id="category-dialog-title"
          className="text-lg font-semibold sm:text-xl"
        >
          What do you like to listen to?
        </h2>
        <p className="text-sm text-muted">
          Pick at least one category for your passive immersion videos. You can
          change it later on the Channels page.
        </p>
      </div>
      <CategoryPicker
        categories={categories}
        initial={[]}
        saveLabel="Continue"
      />
    </dialog>
  );
}
