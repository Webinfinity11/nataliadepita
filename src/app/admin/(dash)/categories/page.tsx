import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings } from "@/db/schema";
import { createCategory, updateCategory } from "./actions";
import { DeleteCategoryButton } from "./DeleteCategoryButton";

export default async function CategoriesPage() {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      count: sql<number>`count(${paintings.id})::int`,
    })
    .from(categories)
    .leftJoin(paintings, eq(paintings.categoryId, categories.id))
    .groupBy(categories.id)
    .orderBy(asc(categories.position), asc(categories.name));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Portfolio</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Categories
        </h1>
      </header>

      {/* create */}
      <form
        action={createCategory}
        className="flex flex-wrap items-center gap-3 rounded-[8px] border border-ink-200 bg-white p-4"
      >
        <input name="name" placeholder="New category" required className="min-w-[180px]" />
        <input
          name="description"
          placeholder="Description (optional)"
          className="min-w-[200px] flex-1"
        />
        <button className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50">
          Add
        </button>
      </form>

      {/* list */}
      <ul className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
        {rows.map((c, i) => (
          <li
            key={c.id}
            className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
              i > 0 ? "border-t border-ink-100" : ""
            }`}
          >
            <form action={updateCategory} className="flex flex-1 flex-wrap items-center gap-3">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="min-w-[150px]" />
              <input
                name="description"
                defaultValue={c.description ?? ""}
                placeholder="Description"
                className="min-w-[180px] flex-1"
              />
              <span className="font-mono text-xs text-ink-400">/{c.slug}</span>
              <span className="whitespace-nowrap text-xs uppercase tracking-[0.14em] text-ink-400">
                {c.count} {c.count === 1 ? "work" : "works"}
              </span>
              <button className="rounded-[6px] border border-ink-300 px-3 py-1.5 text-sm text-ink-700 hover:border-ink-900 hover:text-ink-900">
                Save
              </button>
            </form>
            <DeleteCategoryButton id={c.id} name={c.name} count={c.count} />
          </li>
        ))}
      </ul>
    </div>
  );
}
