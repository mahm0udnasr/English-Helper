"use client";

import { useState, useTransition } from "react";
import { FaBan, FaLockOpen, FaTrash } from "react-icons/fa6";
import { deleteUser, setUserBlocked } from "./actions";

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

  const run = (action: () => Promise<{ error?: string }>) =>
    startTransition(async () => {
      const result = await action();
      setError(result.error);
    });

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex justify-end gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => setUserBlocked(userId, !blocked))}
          className="btn-ghost"
        >
          {blocked ? <FaLockOpen /> : <FaBan />}
          {blocked ? "Unblock" : "Block"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (
              confirm(
                `Delete ${label}? Their progress and settings are removed too. This can't be undone.`,
              )
            )
              run(() => deleteUser(userId));
          }}
          className="btn-ghost text-red-500"
        >
          <FaTrash />
          Delete
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
