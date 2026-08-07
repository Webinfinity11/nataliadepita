import Link from "next/link";
import Image from "next/image";
import type { Painting } from "@/db/schema";

// The cover's real pixel size, so each work keeps its own shape in the grid.
export type GridWork = Painting & {
  coverWidth: number | null;
  coverHeight: number | null;
};

export function PaintingGrid({
  categorySlug,
  paintings,
  // A grid living inside a half-width section has half the room, so it stops
  // at two columns instead of three.
  narrow = false,
}: {
  categorySlug: string;
  paintings: GridWork[];
  narrow?: boolean;
}) {
  if (paintings.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="font-display text-3xl text-ink-400">
          No works in this collection yet.
        </p>
        <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
      </div>
    );
  }
  return (
    // Masonry columns: a collection mixes landscape and portrait works, so each
    // one is shown at its own aspect ratio instead of cropped into one box.
    <div
      className={
        narrow
          ? "columns-1 gap-x-8 sm:columns-2"
          : "columns-1 gap-x-10 sm:columns-2 lg:columns-3"
      }
    >
      {paintings.map((p) => (
        <Link
          key={p.id}
          href={`/${categorySlug}/${p.slug}`}
          className={`group block break-inside-avoid ${narrow ? "mb-10" : "mb-16"}`}
        >
          <div className="w-full overflow-hidden bg-ink-100">
            {p.coverPhotoUrl && (
              <Image
                src={p.coverPhotoUrl}
                alt={p.title}
                width={p.coverWidth ?? 900}
                height={p.coverHeight ?? 1125}
                sizes={
                  narrow
                    ? "(min-width: 1024px) 280px, (min-width: 640px) 45vw, 90vw"
                    : "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                }
                className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
            )}
          </div>
          <h3
            className={`mt-4 font-display leading-tight tracking-tight text-ink-900 ${
              narrow ? "text-xl" : "text-2xl"
            }`}
          >
            {p.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
