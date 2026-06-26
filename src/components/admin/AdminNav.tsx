"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/admin/login/actions";

const NAV: [string, string][] = [
  ["Dashboard", "/admin"],
  ["Categories", "/admin/categories"],
  ["Paintings", "/admin/paintings"],
  ["Featured", "/admin/featured"],
  ["Blog", "/admin/blog"],
  ["Settings", "/admin/settings"],
  ["Messages", "/admin/messages"],
];

export default function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="flex h-full flex-col">
      <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {NAV.map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className={`whitespace-nowrap rounded-[6px] px-3 py-2 text-sm transition-colors ${
              isActive(href)
                ? "bg-ink-900 text-ink-50"
                : "text-ink-600 hover:bg-ink-100 hover:text-ink-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto hidden flex-col gap-3 pt-6 lg:flex">
        <Link
          href="/"
          target="_blank"
          className="text-xs uppercase tracking-[0.18em] text-ink-400 transition-colors hover:text-ink-900"
        >
          View site ↗
        </Link>
        <form action={logout}>
          <button className="text-sm text-danger-600 transition-colors hover:text-danger-700">
            Log out
          </button>
        </form>
      </div>
    </div>
  );
}
