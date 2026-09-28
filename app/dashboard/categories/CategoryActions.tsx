"use client";

import { FaPen, FaTrash } from "react-icons/fa6";
import ActionMenu from "../ActionMenu";
import { deleteCategory, renameCategory } from "./actions";

export default function CategoryActions({
  id,
  name,
  channelCount,
}: {
  id: string;
  name: string;
  channelCount: number;
}) {
  return (
    <ActionMenu
      label={name}
      items={[
        {
          label: "Rename",
          icon: FaPen,
          onSelect: () => {
            const next = prompt("Rename category", name)?.trim();
            return next && next !== name ? renameCategory(id, next) : undefined;
          },
        },
        {
          label: "Delete",
          icon: FaTrash,
          danger: true,
          onSelect: () =>
            confirm(
              `Delete "${name}"? Its ${channelCount} channel${channelCount === 1 ? "" : "s"} will be deleted too, and users lose it from their picks.`,
            )
              ? deleteCategory(id)
              : undefined,
        },
      ]}
    />
  );
}
