"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export function HomeSlider({
  slides,
}: {
  slides: { url: string; title: string }[];
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(
      () => setI((p) => (p + 1) % slides.length),
      5000,
    );
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  return (
    <section className="relative h-[70vh] w-full overflow-hidden bg-neutral-50">
      {slides.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            idx === i ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={s.url}
            alt={s.title}
            fill
            priority={idx === 0}
            className="object-contain"
          />
        </div>
      ))}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            aria-label={`Slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full ${
              idx === i ? "bg-neutral-900" : "bg-neutral-300"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
