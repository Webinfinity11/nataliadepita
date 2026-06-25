import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos } from "@/db/schema";
import { Lightbox } from "@/components/Lightbox";

export default async function PaintingPage({
  params,
}: {
  params: Promise<{ category: string; painting: string }>;
}) {
  const { category, painting } = await params;
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, category));
  if (!cat) notFound();
  const [p] = await db
    .select()
    .from(paintings)
    .where(
      and(eq(paintings.categoryId, cat.id), eq(paintings.slug, painting)),
    );
  if (!p) notFound();
  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.paintingId, p.id))
    .orderBy(asc(photos.position));
  // ensure the cover is first
  pics.sort((a, b) =>
    a.url === p.coverPhotoUrl ? -1 : b.url === p.coverPhotoUrl ? 1 : 0,
  );
  return (
    <article className="mx-auto max-w-4xl px-6 py-14 lg:py-20">
      <Link
        href={`/${cat.slug}`}
        className="text-xs uppercase tracking-[0.24em] text-ink-500 transition-colors hover:text-ink-900"
      >
        ← {cat.name}
      </Link>
      <div className="mt-8">
        <Lightbox photos={pics} />
      </div>
      <h1 className="mt-10 font-display text-4xl leading-tight tracking-tight text-ink-900 sm:text-5xl">
        {p.title}
      </h1>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-ink-500">
        {cat.name}
      </p>
      {p.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-ink-700">
          {p.description}
        </p>
      )}
    </article>
  );
}
