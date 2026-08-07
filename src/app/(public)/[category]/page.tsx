import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos, projectSections } from "@/db/schema";
import { PaintingGrid, type GridWork } from "@/components/PaintingGrid";
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
      sectionId: paintings.sectionId,
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

  const sections = await db
    .select()
    .from(projectSections)
    .where(eq(projectSections.categoryId, cat.id))
    .orderBy(asc(projectSections.position), asc(projectSections.id));

  const inSection = (id: number) => works.filter((w) => w.sectionId === id);
  const loose = works.filter(
    (w) => !w.sectionId || !sections.some((s) => s.id === w.sectionId),
  );

  // Two "half" sections in a row stand side by side; anything else runs the
  // full width. Grouping here keeps the JSX below a flat list of rows.
  const rowsOfSections: (typeof sections)[] = [];
  for (const s of sections) {
    const last = rowsOfSections[rowsOfSections.length - 1];
    if (s.layout === "half" && last?.length === 1 && last[0].layout === "half") {
      last.push(s);
    } else {
      rowsOfSections.push([s]);
    }
  }

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

      {sections.length > 0 ? (
        <div className="mx-auto max-w-[1240px] py-14 lg:py-20">
          {rowsOfSections.map((row, i) => (
            <div
              key={row[0].id}
              className={`${i > 0 ? "mt-20 lg:mt-28" : ""} ${
                row.length === 2 ? "grid gap-14 lg:grid-cols-2 lg:gap-20" : ""
              }`}
            >
              {row.map((s) => (
                <section key={s.id}>
                  <h2
                    className={`font-display tracking-tight text-ink-900 ${
                      s.layout === "half"
                        ? "text-3xl sm:text-4xl"
                        : "text-4xl sm:text-5xl"
                    }`}
                  >
                    {s.title}
                  </h2>
                  {s.subtitle && (
                    <p className="mt-4 whitespace-pre-line text-sm leading-relaxed tracking-wide text-ink-500">
                      {s.subtitle}
                    </p>
                  )}
                  {s.body && (
                    <div className="mt-6 max-w-3xl space-y-5 text-lg leading-relaxed text-ink-700">
                      {s.body.split(/\n{2,}/).map((para, j) => (
                        <p key={j} className="whitespace-pre-wrap">
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                  <SectionWorks
                    slug={cat.slug}
                    works={inSection(s.id)}
                    half={s.layout === "half"}
                  />
                </section>
              ))}
            </div>
          ))}

          {loose.length > 0 && (
            <div className="mt-20 border-t border-ink-200 pt-14 lg:mt-28">
              <PaintingGrid categorySlug={cat.slug} paintings={loose} />
            </div>
          )}
        </div>
      ) : (
        <section className="mx-auto max-w-[1240px] py-14 lg:py-20">
          <PaintingGrid categorySlug={cat.slug} paintings={works} />
        </section>
      )}
    </main>
  );
}

// A section that carries only prose (the project introduction) should not
// announce an empty gallery, so nothing is drawn when it holds no works.
function SectionWorks({
  slug,
  works,
  half,
}: {
  slug: string;
  works: GridWork[];
  half: boolean;
}) {
  if (works.length === 0) return null;
  return (
    <div className={half ? "mt-8" : "mt-10"}>
      <PaintingGrid categorySlug={slug} paintings={works} narrow={half} />
    </div>
  );
}
