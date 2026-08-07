import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos, projectSections } from "@/db/schema";
import { PaintingGrid } from "@/components/PaintingGrid";
import { videoCovers, coverFor } from "@/lib/queries";
import type { ProjectSection } from "@/db/schema";

// Two half sections in a row stand side by side; everything else takes a row
// of its own. Working the pairs out here keeps the page a flat list of rows.
function pairUp(sections: ProjectSection[]): ProjectSection[][] {
  const rows: ProjectSection[][] = [];
  for (const s of sections) {
    const last = rows[rows.length - 1];
    if (s.half && last?.length === 1 && last[0].half) last.push(s);
    else rows.push([s]);
  }
  return rows;
}

function SectionHeader({ section: s }: { section: ProjectSection }) {
  const prose = (text: string, cls: string) => (
    <div className={cls}>
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {para}
        </p>
      ))}
    </div>
  );

  if (s.style === "project") {
    return (
      <header className="mx-auto max-w-[820px] text-center">
        <h2 className="font-display text-4xl tracking-tight text-ink-900 sm:text-5xl">
          {s.title}
        </h2>
        {s.subtitle && (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed tracking-wide text-ink-500">
            {s.subtitle}
          </p>
        )}
        {s.body &&
          prose(
            s.body,
            "mt-8 space-y-5 text-left text-lg leading-relaxed text-ink-700",
          )}
      </header>
    );
  }
  // A quiet label, so a part of a project never competes with the project's
  // own name for the eye.
  return (
    <header className="border-t border-ink-300 pt-5">
      <h3 className="text-xs uppercase tracking-[0.28em] text-ink-500">
        {s.title}
      </h3>
      {s.subtitle && (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-500">
          {s.subtitle}
        </p>
      )}
      {s.body &&
        prose(
          s.body,
          "mt-4 max-w-[820px] space-y-4 text-lg leading-relaxed text-ink-700",
        )}
    </header>
  );
}

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

  const loose = works.filter(
    (w) => !w.sectionId || !sections.some((s) => s.id === w.sectionId),
  );

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

      <div className="mx-auto max-w-[1240px] py-14 lg:py-20">
        {pairUp(sections).map((row, i) => {
          const paired = row.length === 2;
          const opensAProject = row[0].style === "project";
          return (
            <div
              key={row[0].id}
              className={`${
                i === 0 ? "" : opensAProject ? "mt-24 lg:mt-32" : "mt-16 lg:mt-20"
              } ${paired ? "grid gap-14 lg:grid-cols-2 lg:gap-0" : ""}`}
            >
              {row.map((s, j) => (
                <section
                  key={s.id}
                  className={
                    !paired
                      ? ""
                      : j === 0
                        ? "lg:pr-10 xl:pr-14"
                        : // The rule between the pair says, at a glance, that
                          // these two columns are read side by side.
                          "lg:border-l lg:border-ink-200 lg:pl-10 xl:pl-14"
                  }
                >
                  <SectionHeader section={s} />
                  {works.some((w) => w.sectionId === s.id) && (
                    <div className={s.style === "project" ? "mt-14" : "mt-10"}>
                      <PaintingGrid
                        categorySlug={cat.slug}
                        paintings={works.filter((w) => w.sectionId === s.id)}
                        maxColumns={s.half ? 2 : 3}
                      />
                    </div>
                  )}
                </section>
              ))}
            </div>
          );
        })}

        {loose.length > 0 && (
          <div className={sections.length > 0 ? "mt-24 lg:mt-32" : ""}>
            <PaintingGrid categorySlug={cat.slug} paintings={loose} />
          </div>
        )}
      </div>
    </main>
  );
}
