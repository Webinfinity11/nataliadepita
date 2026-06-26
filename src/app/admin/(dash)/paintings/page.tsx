import { asc } from "drizzle-orm";
import { db } from "@/db";
import { paintings, categories } from "@/db/schema";
import { createPainting } from "./actions";
import { PaintingsBrowser } from "./PaintingsBrowser";

export default async function PaintingsPage() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
  const rows = await db
    .select()
    .from(paintings)
    .orderBy(asc(paintings.position), asc(paintings.title));

  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const enriched = rows.map((p) => ({
    id: p.id,
    title: p.title,
    coverPhotoUrl: p.coverPhotoUrl,
    categoryName: catName.get(p.categoryId) ?? "—",
  }));

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Portfolio</p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
            Paintings
          </h1>
        </div>
        <span className="text-sm text-ink-500">{rows.length} works total</span>
      </header>

      {/* create */}
      <form
        action={createPainting}
        className="flex flex-wrap items-center gap-3 rounded-[8px] border border-ink-200 bg-white p-4"
      >
        <input name="title" placeholder="Title" required className="min-w-[180px]" />
        <select name="categoryId" required>
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="description"
          placeholder="Description (optional)"
          className="min-w-[200px] flex-1"
        />
        <button className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50">
          Create
        </button>
      </form>

      {cats.length === 0 ? (
        <p className="rounded-[8px] border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700">
          Create a category first before adding paintings.
        </p>
      ) : (
        <PaintingsBrowser rows={enriched} categories={cats.map((c) => c.name)} />
      )}
    </div>
  );
}
