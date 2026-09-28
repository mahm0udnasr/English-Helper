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
      className="card m-auto w-[calc(100%-2rem)] max-w-md text-foreground backdrop:bg-black/50"
    >
      <div className="mb-5 flex flex-col items-center gap-2 text-center">
        <FaHeadphones className="text-3xl text-accent" />
        <h2 id="category-dialog-title" className="text-xl font-semibold">
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
