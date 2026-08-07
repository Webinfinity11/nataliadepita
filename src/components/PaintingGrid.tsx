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
  // A grid inside a half-width section has half the room, so it is capped at
  // two columns before the "no more columns than works" rule applies.
  maxColumns = 3,
}: {
  categorySlug: string;
  paintings: GridWork[];
  maxColumns?: 2 | 3;
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
  // A group of one or two would otherwise sit stranded in the first third of
  // the page, so the grid never opens more columns than it has works to fill.
  const cols = Math.min(maxColumns, paintings.length);
  const tight = maxColumns === 2;
  const shell =
    cols === 1
      ? ""
      : cols === 2
        ? `columns-1 sm:columns-2 ${tight ? "gap-x-6" : "gap-x-10"}`
        : "columns-1 gap-x-10 sm:columns-2 lg:columns-3";
  const sizes =
    cols === 1
      ? tight
        ? "(min-width: 1024px) 560px, 92vw"
        : "(min-width: 1024px) 900px, 92vw"
      : cols === 2
        ? tight
          ? "(min-width: 1024px) 270px, (min-width: 640px) 45vw, 90vw"
          : "(min-width: 640px) 45vw, 90vw"
        : "(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw";

  return (
    // Masonry columns: a collection mixes landscape and portrait works, so each
    // one is shown at its own aspect ratio instead of cropped into one box.
    <div className={shell}>
      {paintings.map((p) => (
        <Link
          key={p.id}
          href={`/${categorySlug}/${p.slug}`}
          className={`group block break-inside-avoid ${
            tight ? "mb-9 last:mb-0" : "mb-16 last:mb-0"
          }`}
        >
          <div className="w-full overflow-hidden bg-ink-100">
            {p.coverPhotoUrl && (
              <Image
                src={p.coverPhotoUrl}
                alt={p.title}
                width={p.coverWidth ?? 900}
                height={p.coverHeight ?? 1125}
                sizes={sizes}
                className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
            )}
          </div>
          <h3
            className={`font-display leading-tight tracking-tight text-ink-900 ${
              tight ? "mt-3 text-lg" : "mt-4 text-2xl"
            }`}
          >
            {p.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
