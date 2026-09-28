"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaLayerGroup, FaUsers } from "react-icons/fa6";

const links = [
  { href: "/dashboard/users", label: "Users", icon: FaUsers },
  { href: "/dashboard/categories", label: "Categories", icon: FaLayerGroup },
] as const;

// Vertical on tablets and up, a scrollable row on phones.
export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="shrink-0 sm:w-48">
      <ul className="flex gap-1 overflow-x-auto sm:flex-col">
        {links.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors ${
                pathname.startsWith(href)
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-muted hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <Icon />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
