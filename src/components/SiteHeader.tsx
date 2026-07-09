"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Cat = { name: string; slug: string };
type DropItem = { name: string; href: string };

const MEDIA_ITEMS: DropItem[] = [
  { name: "Photogallery", href: "/photogallery" },
  { name: "Videos", href: "/videos" },
];

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

  const portfolioItems: DropItem[] = categories.map((c) => ({
    name: c.name,
    href: `/${c.slug}`,
  }));

  const isActive = (key: string) => {
    switch (key) {
      case "Home":
        return pathname === "/";
      case "About":
        return pathname.startsWith("/about");
      case "Portfolio":
        return pathname === "/portfolio" || catSlugs.has(firstSeg.slice(1));
      case "Media":
        return (
          pathname.startsWith("/photogallery") || pathname.startsWith("/videos")
        );
      case "News":
        return pathname.startsWith("/blog");
      case "Contact":
        return pathname.startsWith("/contact");
      default:
        return false;
    }
  };

  const NAV: { label: string; href: string; items?: DropItem[] }[] = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about" },
    { label: "Portfolio", href: "/portfolio", items: portfolioItems },
    { label: "Media", href: "/photogallery", items: MEDIA_ITEMS },
    { label: "News", href: "/blog" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-ink-200 bg-ink-50/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-7 lg:px-14">
        <Link href="/" className="flex items-center gap-3 text-ink-900">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="h-11 w-auto sm:h-12" />
          <span className="font-display text-[26px] leading-none tracking-tight sm:text-[32px]">
            Natalia&nbsp;de&nbsp;Pita
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden items-center gap-9 lg:flex xl:gap-12">
          {NAV.map((l) =>
            l.items ? (
              <NavDropdown
                key={l.label}
                label={l.label}
                href={l.href}
                items={l.items}
                active={isActive(l.label)}
              />
            ) : (
              <Link
                key={l.label}
                href={l.href}
                className={`text-[16px] font-medium leading-none text-ink-900 transition-colors hover:text-ink-950 ${
                  isActive(l.label)
                    ? "underline decoration-1 underline-offset-[7px]"
                    : ""
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
              {l.items?.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="border-b border-ink-100 bg-ink-100 px-10 py-2.5 text-xs text-ink-500 hover:text-ink-800"
                >
                  {item.name}
                </Link>
              ))}
            </React.Fragment>
          ))}
        </nav>
      )}
    </header>
  );
}

function NavDropdown({
  label,
  href,
  items,
  active,
}: {
  label: string;
  href: string;
  items: DropItem[];
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
        className={`flex items-center gap-1.5 text-[16px] font-medium leading-none text-ink-900 transition-colors hover:text-ink-950 ${
          active ? "underline decoration-1 underline-offset-[7px]" : ""
        }`}
      >
        {label}
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
          {items.map((item, i) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-5 py-2.5 text-[12.5px] tracking-wide text-ink-600 transition-colors hover:bg-ink-100 hover:text-ink-900${
                i < items.length - 1 ? " border-b border-ink-100" : ""
              }`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
