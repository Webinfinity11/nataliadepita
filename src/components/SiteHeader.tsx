"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Cat = { name: string; slug: string };

const CHEVRON = (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M2 4l4 4 4-4" />
  </svg>
);

export default function SiteHeader({ categories }: { categories: Cat[] }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const catSlugs = new Set(categories.map((c) => c.slug));
  const firstSeg = "/" + (pathname.split("/")[1] ?? "");

  const isActive = (key: string) => {
    switch (key) {
      case "Home":
        return pathname === "/";
      case "About":
        return pathname.startsWith("/about");
      case "Portfolio":
        return pathname === "/portfolio" || catSlugs.has(firstSeg.slice(1));
      case "News":
        return pathname.startsWith("/blog");
      case "Contact":
        return pathname.startsWith("/contact");
      default:
        return false;
    }
  };

  const NAV: { label: string; href: string }[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Portfolio", href: "/portfolio" },
    { label: "News", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-ink-50/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between px-6 py-5 lg:px-12">
        <Link
          href="/"
          className="font-display text-2xl leading-none tracking-tight text-ink-900"
        >
          Natalia&nbsp;de&nbsp;Pita
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((l) =>
            l.label === "Portfolio" ? (
              <PortfolioDropdown
                key={l.label}
                href={l.href}
                categories={categories}
                active={isActive("Portfolio")}
              />
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className={`text-[13px] tracking-wide transition-colors hover:text-ink-900 ${
                  isActive(l.label) ? "text-ink-900" : "text-ink-600"
                }`}
              >
                {l.label}
              </Link>
            )
          )}
        </nav>

        {/* mobile toggle */}
        <button
          type="button"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
          className="text-ink-900 lg:hidden"
        >
          {open ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M4 8h16M4 16h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <nav className="flex flex-col border-t border-ink-200 lg:hidden">
          {NAV.map((l) => (
            <React.Fragment key={l.label}>
              <Link
                href={l.href}
                onClick={() => setOpen(false)}
                className={`border-b border-ink-100 px-6 py-3.5 text-sm transition-colors hover:bg-ink-100 ${
                  isActive(l.label) ? "text-ink-900" : "text-ink-700"
                }`}
              >
                {l.label}
              </Link>
              {l.label === "Portfolio" &&
                categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/${cat.slug}`}
                    onClick={() => setOpen(false)}
                    className="border-b border-ink-100 bg-ink-100 px-10 py-2.5 text-xs text-ink-500 hover:text-ink-800"
                  >
                    {cat.name}
                  </Link>
                ))}
            </React.Fragment>
          ))}
        </nav>
      )}
    </header>
  );
}

function PortfolioDropdown({
  href,
  categories,
  active,
}: {
  href: string;
  categories: Cat[];
  active: boolean;
}) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link
        href={href}
        className={`flex items-center gap-1 text-[13px] tracking-wide transition-colors hover:text-ink-900 ${
          active ? "text-ink-900" : "text-ink-600"
        }`}
      >
        Portfolio
        <span className={`transition-transform duration-200 ${hover ? "rotate-180" : ""}`}>
          {CHEVRON}
        </span>
      </Link>

      <div
        style={{
          opacity: hover ? 1 : 0,
          transform: hover ? "translateY(0)" : "translateY(-6px)",
          pointerEvents: hover ? "auto" : "none",
          transition: "opacity 180ms ease, transform 180ms ease",
        }}
        className="absolute left-1/2 top-full z-10 -translate-x-1/2 pt-3"
      >
        <div className="min-w-[180px] overflow-hidden rounded-card border border-ink-200 bg-ink-50 shadow-pop">
          {categories.map((cat, i) => (
            <Link
              key={cat.slug}
              href={`/${cat.slug}`}
              className={`block px-5 py-2.5 text-[12.5px] tracking-wide text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900${
                i < categories.length - 1 ? " border-b border-ink-100" : ""
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
