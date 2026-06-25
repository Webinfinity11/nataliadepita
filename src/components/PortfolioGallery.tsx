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

export default function PortfolioGallery({
  works,
  categories,
}: {
  works: Work[];
  categories: string[];
}) {
  const [filter, setFilter] = useState("All");
  const filters = ["All", ...categories];
  const shown = filter === "All" ? works : works.filter((w) => w.categoryName === filter);

  return (
    <main>
      {/* filter bar */}
      <section className="px-6 pt-12 lg:px-12 lg:pt-16">
        <p className="mb-8 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Portfolio
        </p>
        <div className="-mx-6 overflow-x-auto px-6 lg:mx-0 lg:px-0">
          <div className="mx-auto flex w-max items-center justify-center gap-0 lg:w-full lg:flex-wrap">
            {filters.map((f, i) => (
              <React.Fragment key={f}>
                {i > 0 && <span className="px-3 text-ink-300">·</span>}
                <button
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`whitespace-nowrap py-1 text-[15px] transition-colors ${
                    filter === f
                      ? "text-ink-900 underline decoration-ink-900 decoration-1 underline-offset-[6px]"
                      : "text-ink-500 hover:text-ink-900"
                  }`}
                >
                  {f}
                </button>
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* grid */}
      {shown.length === 0 ? (
        <section className="px-6 py-32 text-center lg:px-12">
          <p className="font-display text-3xl text-ink-400">
            No works in this collection yet.
          </p>
          <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
        </section>
      ) : (
        <section className="px-6 py-14 lg:px-12 lg:py-20">
          <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>
      )}
    </main>
  );
}
