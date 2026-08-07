import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, projectSections } from "@/db/schema";
import {
  addSection,
  assignWorks,
  moveSection,
  removeSection,
  updateSection,
} from "./actions";

export default async function CategorySectionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const categoryId = Number(id);
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId));
  if (!cat) notFound();

  const sections = await db
    .select()
    .from(projectSections)
    .where(eq(projectSections.categoryId, categoryId))
    .orderBy(asc(projectSections.position), asc(projectSections.id));
  const works = await db
    .select({
      id: paintings.id,
      title: paintings.title,
      sectionId: paintings.sectionId,
      coverPhotoUrl: paintings.coverPhotoUrl,
    })
    .from(paintings)
    .where(eq(paintings.categoryId, categoryId))
    .orderBy(asc(paintings.position), asc(paintings.title));

  return (
    <div className="space-y-12">
      <header>
        <Link
          href="/admin/categories"
          className="text-xs uppercase tracking-[0.24em] text-ink-400 hover:text-ink-900"
        >
          ← Categories
        </Link>
        <h1 className="mt-3 font-display text-4xl tracking-tight text-ink-900">
          {cat.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          Sections split this collection into named parts on{" "}
          <span className="font-mono">/{cat.slug}</span>. Two “half” sections in
          a row stand side by side; a section with text but no works reads as an
          introduction. Without sections the page stays one plain grid.
        </p>
      </header>

      {/* sections */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight text-ink-900">
          Sections{" "}
          <span className="text-base font-normal text-ink-400">
            ({sections.length})
          </span>
        </h2>

        {sections.map((s, i) => (
          <div
            key={s.id}
            className="rounded-[8px] border border-ink-200 bg-white p-4"
          >
            <form action={updateSection} className="space-y-3">
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="categoryId" value={categoryId} />
              <div className="flex flex-wrap items-center gap-3">
                <span className="w-5 text-sm text-ink-400">{i + 1}</span>
                <input
                  name="title"
                  defaultValue={s.title}
                  className="min-w-[220px] flex-1"
                />
                <select name="layout" defaultValue={s.layout}>
                  <option value="full">Full width</option>
                  <option value="half">Half width</option>
                </select>
                <span className="whitespace-nowrap text-xs uppercase tracking-[0.14em] text-ink-400">
                  {works.filter((w) => w.sectionId === s.id).length} works
                </span>
                <button className="rounded-[6px] border border-ink-300 px-3 py-1.5 text-sm text-ink-700 hover:border-ink-900 hover:text-ink-900">
                  Save
                </button>
              </div>
              <textarea
                name="subtitle"
                defaultValue={s.subtitle ?? ""}
                rows={s.subtitle ? 4 : 2}
                placeholder="Facts under the heading (optional) — place, years, size, medium."
                className="w-full"
              />
              <textarea
                name="body"
                defaultValue={s.body ?? ""}
                rows={s.body ? 6 : 2}
                placeholder="Text shown under the heading (optional). Leave a blank line between paragraphs."
                className="w-full"
              />
            </form>
            <div className="mt-3 flex items-center gap-2 border-t border-ink-100 pt-3">
              <form action={moveSection}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="dir" value="up" />
                <button
                  disabled={i === 0}
                  className="px-2 text-ink-500 hover:text-ink-900 disabled:opacity-25"
                  title="Move up"
                >
                  ↑
                </button>
              </form>
              <form action={moveSection}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <input type="hidden" name="dir" value="down" />
                <button
                  disabled={i === sections.length - 1}
                  className="px-2 text-ink-500 hover:text-ink-900 disabled:opacity-25"
                  title="Move down"
                >
                  ↓
                </button>
              </form>
              <form action={removeSection} className="ml-auto">
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="categoryId" value={categoryId} />
                <button className="text-sm text-danger-600 hover:text-danger-700">
                  Remove section
                </button>
              </form>
            </div>
          </div>
        ))}

        <form
          action={addSection}
          className="space-y-3 rounded-[8px] border border-dashed border-ink-300 bg-white p-4"
        >
          <input type="hidden" name="categoryId" value={categoryId} />
          <div className="flex flex-wrap items-center gap-3">
            <input
              name="title"
              placeholder="New section heading"
              required
              className="min-w-[220px] flex-1"
            />
            <select name="layout" defaultValue="full">
              <option value="full">Full width</option>
              <option value="half">Half width</option>
            </select>
            <button className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50">
              Add
            </button>
          </div>
          <textarea
            name="subtitle"
            rows={2}
            placeholder="Facts under the heading (optional)"
            className="w-full"
          />
          <textarea
            name="body"
            rows={2}
            placeholder="Text (optional)"
            className="w-full"
          />
        </form>
      </section>

      {/* assignment */}
      {sections.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl tracking-tight text-ink-900">
            Which work goes where
          </h2>
          <form action={assignWorks} className="space-y-4">
            <input type="hidden" name="categoryId" value={categoryId} />
            <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
              {works.map((w, i) => (
                <li
                  key={w.id}
                  className={`flex flex-wrap items-center gap-4 px-4 py-2.5 ${
                    i > 0 ? "border-t border-ink-100" : ""
                  }`}
                >
                  {w.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.coverPhotoUrl}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-[40px] w-[54px] rounded-[4px] bg-ink-100 object-cover"
                    />
                  ) : (
                    <span className="h-[40px] w-[54px] rounded-[4px] bg-ink-100" />
                  )}
                  <span className="min-w-[200px] flex-1 truncate text-sm text-ink-900">
                    {w.title}
                  </span>
                  <select
                    name={`section-${w.id}`}
                    defaultValue={String(w.sectionId ?? 0)}
                  >
                    <option value="0">— no section —</option>
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ol>
            <button className="bg-ink-900 px-5 py-2.5 text-sm font-medium text-ink-50">
              Save assignments
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
