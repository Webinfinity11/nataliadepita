"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Slide = { url: string; title: string };

export default function HomeHero({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);
  const many = slides.length > 1;

  useEffect(() => {
    if (!many) return;
    const t = setInterval(() => setI((v) => (v + 1) % slides.length), 5500);
    return () => clearInterval(t);
  }, [many, slides.length]);

  if (slides.length === 0) return null;

  return (
    <section className="px-6 pb-10 pt-12 lg:px-12 lg:pb-16 lg:pt-20">
      <div className="mx-auto max-w-[1080px]">
        <div className="relative mx-auto aspect-[16/9] w-full overflow-hidden bg-ink-100 shadow-[0_40px_80px_-50px_rgba(26,24,21,0.45)]">
          {slides.map((s, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={s.url}
              alt={s.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>

        {many && (
          <div className="mt-7 flex items-center justify-center gap-2.5">
            {slides.map((s, idx) => (
              <button
                key={idx}
                type="button"
                aria-label={`Show ${s.title}`}
                onClick={() => setI(idx)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === i ? "w-5 bg-ink-900" : "w-1.5 bg-ink-300 hover:bg-ink-500"
                }`}
              />
            ))}
          </div>
        )}

        <div className="mt-8 flex justify-center">
          <Link
            href="/portfolio"
            className="inline-flex items-center gap-2 text-sm font-medium tracking-wide text-ink-600 transition-colors hover:text-ink-900"
          >
            See more
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
