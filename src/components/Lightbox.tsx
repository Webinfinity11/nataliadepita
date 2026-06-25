"use client";
import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/db/schema";

export function Lightbox({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  if (!photos.length) return null;
  const main = photos[active];
  return (
    <div>
      <button
        className="relative block w-full"
        onClick={() => setOpen(true)}
        aria-label="View larger"
      >
        <Image
          src={main.url}
          alt=""
          width={main.width ?? 1200}
          height={main.height ?? 900}
          className="h-auto w-full object-contain"
          priority
        />
      </button>
      {photos.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {photos.map((ph, i) => (
            <button
              key={ph.id}
              onClick={() => setActive(i)}
              className={`relative h-20 w-20 overflow-hidden bg-ink-100 ${
                i === active ? "ring-2 ring-ink-900" : "opacity-80 hover:opacity-100"
              }`}
            >
              <Image src={ph.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6"
          onClick={() => setOpen(false)}
        >
          <Image
            src={main.url}
            alt=""
            width={main.width ?? 1600}
            height={main.height ?? 1200}
            className="max-h-full w-auto object-contain"
          />
        </div>
      )}
    </div>
  );
}
