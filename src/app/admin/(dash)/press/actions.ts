"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { pressArticles, pressPhotos } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

function refresh() {
  revalidatePath("/admin/press");
  revalidatePath("/press");
}

/* articles */

export async function addPressArticle(formData: FormData) {
  await requireAdmin();
  const title = String(formData.get("title") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!title || !url) return;
  const publication = String(formData.get("publication") ?? "").trim();
  const publishedOn = String(formData.get("publishedOn") ?? "").trim();
  const rows = await db.select({ id: pressArticles.id }).from(pressArticles);
  await db.insert(pressArticles).values({
    title,
    url,
    publication: publication || null,
    publishedOn: publishedOn || null,
    position: rows.length,
  });
  refresh();
}

export async function movePressArticle(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"
  const rows = await db
    .select()
    .from(pressArticles)
    .orderBy(asc(pressArticles.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db
    .update(pressArticles)
    .set({ position: rows[swap].position })
    .where(eq(pressArticles.id, rows[idx].id));
  await db
    .update(pressArticles)
    .set({ position: rows[idx].position })
    .where(eq(pressArticles.id, rows[swap].id));
  refresh();
}

export async function removePressArticle(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(pressArticles).where(eq(pressArticles.id, id));
  refresh();
}

/* photos */

export async function addPressPhotos(
  imgs: { url: string; width: number; height: number }[],
) {
  await requireAdmin();
  if (!imgs.length) return;
  const rows = await db.select({ id: pressPhotos.id }).from(pressPhotos);
  let pos = rows.length;
  for (const img of imgs) {
    await db.insert(pressPhotos).values({
      url: img.url,
      width: img.width || null,
      height: img.height || null,
      position: pos++,
    });
  }
  refresh();
}

export async function movePressPhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir"));
  const rows = await db
    .select()
    .from(pressPhotos)
    .orderBy(asc(pressPhotos.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db
    .update(pressPhotos)
    .set({ position: rows[swap].position })
    .where(eq(pressPhotos.id, rows[idx].id));
  await db
    .update(pressPhotos)
    .set({ position: rows[idx].position })
    .where(eq(pressPhotos.id, rows[swap].id));
  refresh();
}

export async function removePressPhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const [row] = await db
    .select({ url: pressPhotos.url })
    .from(pressPhotos)
    .where(eq(pressPhotos.id, id));
  await db.delete(pressPhotos).where(eq(pressPhotos.id, id));
  if (row?.url) {
    try {
      await del(row.url);
    } catch {
      /* orphan/shared blob — ignore */
    }
  }
  refresh();
}
