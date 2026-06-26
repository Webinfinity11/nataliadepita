"use client";

import React, { useState } from "react";
import Link from "next/link";

type Work = {
  title: string;
  slug: string;
  coverPhotoUrl: string;
  categoryName: string;
  categorySlug: string;
};

type CategoryCard = {
  name: string;
  slug: string;
  cover: string;
  count: number;
};

export default function PortfolioGallery({
  works,
  categories,
}: {
  works: Work[];
  categories: string[];
}) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", ...categories];
  const shown = works.filter((w) => w.categoryName === filter);

  // One card per category, covered by the first uploaded work in that category.
  // Insertion order follows `works` (category position → painting position).
  const categoryCards: CategoryCard[] = [];
  const seen = new Map<string, CategoryCard>();
  for (const w of works) {
    const existing = seen.get(w.categorySlug);
    if (existing) {
      existing.count += 1;
    } else {
      const card: CategoryCard = {
        name: w.categoryName,
        slug: w.categorySlug,
        cover: w.coverPhotoUrl,
        count: 1,
      };
      seen.set(w.categorySlug, card);
      categoryCards.push(card);
    }
  }

  return (
    <main>
      {/* filter bar */}
      <section className="pt-7 lg:pt-9">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-14">
          <div className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
            <div className="flex w-max items-center justify-center gap-0 lg:w-full lg:flex-wrap">
              {filters.map((f, i) => (
                <React.Fragment key={f}>
                  {i > 0 && (
                    <span aria-hidden className="mx-5 h-4 w-px bg-ink-300" />
                  )}
                  <button
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`whitespace-nowrap py-1 text-[17px] text-ink-900 transition-colors hover:text-ink-950 ${
                      filter === f
                        ? "font-semibold underline decoration-ink-900 decoration-1 underline-offset-[6px]"
                        : ""
                    }`}
                  >
                    {f}
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* grid */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-[1600px] px-6 lg:px-14">
          {filter === "All" ? (
            // overview: one card per category → opens the category gallery
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {categoryCards.map((c) => (
                <Link
                  key={c.slug}
                  href={`/${c.slug}`}
                  className="group block text-left"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.cover}
                      alt={c.name}
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display text-2xl leading-tight tracking-tight text-ink-900">
                      {c.name}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ink-500">
                      {c.count} {c.count === 1 ? "work" : "works"}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : shown.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-3xl text-ink-400">
                No works in this collection yet.
              </p>
              <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
            </div>
          ) : (
            // a single category selected → its gallery of works
            <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((w) => (
                <Link
                  key={`${w.categorySlug}/${w.slug}`}
                  href={`/${w.categorySlug}/${w.slug}`}
                  className="group block text-left"
                >
                  <div className="aspect-[4/5] w-full overflow-hidden bg-ink-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={w.coverPhotoUrl}
                      alt={w.title}
                      className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                    />
                  </div>
                  <div className="mt-4">
                    <h3 className="font-display text-2xl leading-tight tracking-tight text-ink-900">
                      {w.title}
                    </h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-ink-500">
                      {w.categoryName}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
