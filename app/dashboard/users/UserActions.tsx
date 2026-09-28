"use client";

import { FaBan, FaLockOpen, FaTrash } from "react-icons/fa6";
import ActionMenu from "../ActionMenu";
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
  return (
    <ActionMenu
      label={label}
      items={[
        {
          label: blocked ? "Unblock" : "Block",
          icon: blocked ? FaLockOpen : FaBan,
          onSelect: () => setUserBlocked(userId, !blocked),
        },
        {
          label: "Delete",
          icon: FaTrash,
          danger: true,
          onSelect: () =>
            confirm(
              `Delete ${label}? Their progress and settings are removed too. This can't be undone.`,
            )
              ? deleteUser(userId)
              : undefined,
        },
      ]}
    />
  );
}
