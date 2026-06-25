import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { paintings, categories } from "@/db/schema";
import { createPainting } from "./actions";

export default async function PaintingsPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const rows = await db
    .select()
    .from(paintings)
    .orderBy(asc(paintings.position), asc(paintings.title));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Paintings</h1>
      <form action={createPainting} className="flex gap-2">
        <input
          name="title"
          placeholder="Title"
          required
          className="border p-2"
        />
        <select name="categoryId" required className="border p-2">
          {cats.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          name="description"
          placeholder="Description (optional)"
          className="border p-2 flex-1"
        />
        <button className="bg-neutral-900 text-white px-4">Create</button>
      </form>
      {cats.length === 0 && (
        <p className="text-sm text-neutral-500">
          Create a category first before adding paintings.
        </p>
      )}
      <ul className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {rows.map((p) => (
          <li key={p.id} className="border">
            <Link
              href={`/admin/paintings/${p.id}`}
              className="block hover:opacity-90"
            >
              {p.coverPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverPhotoUrl}
                  alt={p.title}
                  className="aspect-square w-full object-cover bg-neutral-100"
                />
              ) : (
                <div className="aspect-square w-full grid place-items-center bg-neutral-100 text-xs text-neutral-400">
                  no image
                </div>
              )}
              <span className="block truncate p-1 text-xs underline">
                {p.title}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
