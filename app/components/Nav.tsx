"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaGear,
  FaGraduationCap,
  FaHouse,
  FaTrophy,
  FaYoutube,
} from "react-icons/fa6";

const links = [
  { href: "/", label: "Home", icon: FaHouse },
  { href: "/channels", label: "Channels", icon: FaYoutube },
  { href: "/leaderboard", label: "Leaderboard", icon: FaTrophy },
  { href: "/settings", label: "Settings", icon: FaGear },
] as const;

export default function Nav() {
  const pathname = usePathname();
  if (pathname.startsWith("/login")) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Top bar: tablets and up */}
      <header className="sticky top-0 z-40 hidden border-b border-border bg-surface/80 backdrop-blur sm:block">
        <nav className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <FaGraduationCap className="text-xl text-accent" />
            English Helper
          </Link>
          <ul className="flex items-center gap-1">
            {links.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
                    isActive(href)
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
        </nav>
      </header>

      {/* Bottom tab bar: phones */}
      <nav
        data-tabbar
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/90 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden"
      >
        <ul className="grid grid-cols-4">
          {links.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex flex-col items-center gap-1 py-2.5 text-[11px] transition-colors ${
                    active ? "font-medium text-accent" : "text-muted"
                  }`}
                >
                  <Icon className="text-lg" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
