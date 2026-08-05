import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos } from "@/db/schema";
import { PaintingGrid } from "@/components/PaintingGrid";
import { videoCovers, coverFor } from "@/lib/queries";

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, category));
  if (!cat) notFound();
  // the cover's own dimensions come along, so the grid can keep each shape
  const rows = await db
    .select({
      id: paintings.id,
      title: paintings.title,
      slug: paintings.slug,
      description: paintings.description,
      categoryId: paintings.categoryId,
      coverPhotoUrl: paintings.coverPhotoUrl,
      position: paintings.position,
      createdAt: paintings.createdAt,
      coverWidth: photos.width,
      coverHeight: photos.height,
    })
    .from(paintings)
    .leftJoin(
      photos,
      and(
        eq(photos.paintingId, paintings.id),
        eq(photos.url, paintings.coverPhotoUrl),
      ),
    )
    .where(eq(paintings.categoryId, cat.id))
    .orderBy(asc(paintings.position), asc(paintings.title));
  // Works with no photographs fall back to their video's opening frame.
  const fallbacks = await videoCovers(
    rows.filter((p) => !p.coverPhotoUrl).map((p) => p.id),
  );
  const works = rows.map((p) => {
    const cover = coverFor(p, fallbacks);
    return {
      ...p,
      coverPhotoUrl: cover?.url ?? null,
      coverWidth: cover?.width ?? null,
      coverHeight: cover?.height ?? null,
    };
  });
  return (
    <main className="px-6 lg:px-12">
      <section className="mx-auto max-w-[1240px] pt-12 lg:pt-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Portfolio
        </p>
        <h1 className="text-center font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
          {cat.name}
        </h1>
        {cat.description && (
          <p className="mx-auto mt-5 max-w-2xl text-center text-lg leading-relaxed text-ink-600">
            {cat.description}
          </p>
        )}
        <div className="mt-12 border-t border-ink-200" />
      </section>
      <section className="mx-auto max-w-[1240px] py-14 lg:py-20">
        <PaintingGrid categorySlug={cat.slug} paintings={works} />
      </section>
    </main>
  );
}
