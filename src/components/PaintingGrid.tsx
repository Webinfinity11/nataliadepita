import Link from "next/link";
import Image from "next/image";
import type { Painting } from "@/db/schema";

export function PaintingGrid({
  categorySlug,
  paintings,
}: {
  categorySlug: string;
  paintings: Painting[];
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
    <div className="grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
      {paintings.map((p) => (
        <Link key={p.id} href={`/${categorySlug}/${p.slug}`} className="group block">
          <div className="aspect-[4/5] w-full overflow-hidden bg-ink-100">
            {p.coverPhotoUrl && (
              <Image
                src={p.coverPhotoUrl}
                alt={p.title}
                width={900}
                height={1125}
                className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
              />
            )}
          </div>
          <h3 className="mt-4 font-display text-2xl leading-tight tracking-tight text-ink-900">
            {p.title}
          </h3>
        </Link>
      ))}
    </div>
  );
}
