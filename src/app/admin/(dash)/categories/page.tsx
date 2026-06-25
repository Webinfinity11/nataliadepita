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
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Categories</h1>
      <form action={createCategory} className="flex gap-2">
        <input
          name="name"
          placeholder="New category"
          required
          className="border p-2"
        />
        <input
          name="description"
          placeholder="Description (optional)"
          className="border p-2 flex-1"
        />
        <button className="bg-neutral-900 text-white px-4">Add</button>
      </form>
      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-2 border-b pb-2">
            <form action={updateCategory} className="flex gap-2 flex-1">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="border p-1" />
              <input
                name="description"
                defaultValue={c.description ?? ""}
                className="border p-1 flex-1"
              />
              <span className="text-sm text-neutral-500 self-center">
                /{c.slug}
              </span>
              <span className="text-sm text-neutral-400 self-center whitespace-nowrap">
                {c.count} {c.count === 1 ? "work" : "works"}
              </span>
              <button className="text-sm underline">Save</button>
            </form>
            <DeleteCategoryButton id={c.id} name={c.name} count={c.count} />
          </li>
        ))}
      </ul>
    </div>
  );
}
