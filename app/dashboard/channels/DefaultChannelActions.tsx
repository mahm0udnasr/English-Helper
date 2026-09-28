"use client";

import { FaArrowsRotate, FaTrash } from "react-icons/fa6";
import ActionMenu from "../ActionMenu";
import { deleteDefaultChannel, syncDefaultChannel } from "./actions";

export default function DefaultChannelActions({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  return (
    <ActionMenu
      label={title}
      items={[
        {
          label: "Sync",
          icon: FaArrowsRotate,
          onSelect: () => syncDefaultChannel(id),
        },
        {
          label: "Delete",
          icon: FaTrash,
          danger: true,
          onSelect: () =>
            confirm(`Remove "${title}" from every user's default channels?`)
              ? deleteDefaultChannel(id)
              : undefined,
        },
      ]}
    />
  );
}
