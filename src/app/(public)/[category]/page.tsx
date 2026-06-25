import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings } from "@/db/schema";
import { PaintingGrid } from "@/components/PaintingGrid";

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
  const rows = await db
    .select()
    .from(paintings)
    .where(eq(paintings.categoryId, cat.id))
    .orderBy(asc(paintings.position), asc(paintings.title));
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
        <PaintingGrid categorySlug={cat.slug} paintings={rows} />
      </section>
    </main>
  );
}
