import Image from "next/image";
import { asc, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { featured, paintings } from "@/db/schema";
import { addFeatured, removeFeatured, moveFeatured } from "./actions";

export default async function FeaturedPage() {
  const feat = await db.select().from(featured).orderBy(asc(featured.position));
  const ids = feat.map((f) => f.paintingId);
  const featPaintings = ids.length
    ? await db.select().from(paintings).where(inArray(paintings.id, ids))
    : [];
  const byId = new Map(featPaintings.map((p) => [p.id, p]));
  const candidates = ids.length
    ? await db.select().from(paintings).where(notInArray(paintings.id, ids))
    : await db.select().from(paintings);
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Home slider</h1>
      <form action={addFeatured} className="flex gap-2">
        <select name="paintingId" className="border p-2">
          {candidates.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <button className="bg-neutral-900 text-white px-4">
          Add to slider
        </button>
      </form>
      <ol className="space-y-2">
        {feat.map((f) => {
          const p = byId.get(f.paintingId);
          return (
            <li key={f.id} className="flex items-center gap-3 border-b pb-2">
              {p?.coverPhotoUrl && (
                <Image
                  src={p.coverPhotoUrl}
                  alt=""
                  width={80}
                  height={60}
                  className="object-cover"
                />
              )}
              <span className="flex-1">{p?.title ?? "(missing)"}</span>
              <form action={moveFeatured}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="dir" value="up" />
                <button className="text-sm">↑</button>
              </form>
              <form action={moveFeatured}>
                <input type="hidden" name="id" value={f.id} />
                <input type="hidden" name="dir" value="down" />
                <button className="text-sm">↓</button>
              </form>
              <form action={removeFeatured}>
                <input type="hidden" name="id" value={f.id} />
                <button className="text-sm text-red-600">Remove</button>
              </form>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
