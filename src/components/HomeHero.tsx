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
    <section className="pb-10 pt-6 lg:pb-14 lg:pt-10">
      <div className="mx-auto max-w-[1600px] px-6 lg:px-14">
        <div className="relative mx-auto aspect-[4/5] w-full overflow-hidden bg-ink-100 shadow-[0_50px_100px_-55px_rgba(26,24,21,0.5)] sm:aspect-[16/10] lg:aspect-[16/9]">
          {slides.map((s, idx) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={idx}
              src={s.url}
              alt={s.title}
              draggable={false}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[1200ms] ease-out ${
                idx === i ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          {/* soft scrim so the button + dots read on any image */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-950/35 via-transparent to-ink-950/10" />

          {/* centered EXPLORE button → portfolio */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Link
              href="/portfolio"
              className="group inline-flex items-center gap-3 rounded-full border border-white/40 bg-ink-50/85 px-9 py-4 font-display text-sm uppercase tracking-[0.32em] text-ink-900 shadow-[0_18px_50px_-20px_rgba(20,18,16,0.6)] backdrop-blur-md transition-all duration-300 hover:border-white/60 hover:bg-ink-50/10 hover:tracking-[0.4em] hover:shadow-[0_22px_60px_-18px_rgba(20,18,16,0.7)] hover:backdrop-blur-lg sm:px-12 sm:py-5 sm:text-base"
            >
              Explore
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>

          {/* dots overlaid inside the slider — always visible, never clipped */}
          {many && (
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2.5 sm:bottom-6">
              {slides.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  aria-label={`Show ${s.title}`}
                  onClick={() => setI(idx)}
                  className={`h-1.5 rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-all duration-500 ${
                    idx === i ? "w-6 bg-ink-50" : "w-1.5 bg-ink-50/55 hover:bg-ink-50/90"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
