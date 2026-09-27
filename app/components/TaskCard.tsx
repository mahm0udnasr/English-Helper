"use client";

import { useId, useOptimistic, useState, useTransition } from "react";
import { FaCheck, FaCircleInfo } from "react-icons/fa6";
import { setTaskDone, type TaskKind } from "@/app/actions/tasks";

type Props = {
  kind: TaskKind;
  title: string;
  description: string;
  icon: React.ReactNode;
  done: boolean;
  children?: React.ReactNode;
};

export default function TaskCard({
  kind,
  title,
  description,
  icon,
  done,
  children,
}: Props) {
  const [optimisticDone, setOptimisticDone] = useOptimistic(done);
  const [, startTransition] = useTransition();
  // Phones only: the description is tucked behind an info button.
  const [showInfo, setShowInfo] = useState(false);
  const descriptionId = useId();

  function toggle() {
    const next = !optimisticDone;
    startTransition(async () => {
      setOptimisticDone(next);
      await setTaskDone(kind, next);
    });
  }

  return (
    <div
      className={`card flex flex-col gap-4 transition-colors ${
        optimisticDone ? "border-done/60 bg-done/5" : ""
      }`}
    >
      <div className="flex items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl text-accent">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h2
              className={`text-lg font-semibold ${optimisticDone ? "text-muted line-through" : ""}`}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={() => setShowInfo((v) => !v)}
              aria-expanded={showInfo}
              aria-controls={descriptionId}
              aria-label={`${showInfo ? "Hide" : "Show"} details for ${title}`}
              className={`rounded-full p-1 transition-colors sm:hidden ${
                showInfo ? "text-accent" : "text-muted hover:text-foreground"
              }`}
            >
              <FaCircleInfo />
            </button>
          </div>
          <p
            id={descriptionId}
            className={`text-sm text-muted sm:block ${showInfo ? "block" : "hidden"}`}
          >
            {description}
          </p>
        </div>
        <button
          type="button"
          role="checkbox"
          aria-checked={optimisticDone}
          aria-label={`Mark "${title}" as ${optimisticDone ? "not done" : "done"}`}
          onClick={toggle}
          className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            optimisticDone
              ? "border-done bg-done text-white"
              : "border-border text-transparent hover:border-done hover:text-done/50"
          }`}
        >
          <FaCheck />
        </button>
      </div>

      {children}
    </div>
  );
}
