"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { del } from "@vercel/blob";
import { db } from "@/db";
import { galleryPhotos } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function addGalleryPhotos(
  imgs: { url: string; width: number; height: number }[],
) {
  await requireAdmin();
  if (!imgs.length) return;
  const rows = await db.select({ id: galleryPhotos.id }).from(galleryPhotos);
  let pos = rows.length;
  for (const img of imgs) {
    await db.insert(galleryPhotos).values({
      url: img.url,
      width: img.width || null,
      height: img.height || null,
      position: pos++,
    });
  }
  revalidatePath("/admin/photogallery");
  revalidatePath("/photogallery");
}

export async function moveGalleryPhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"
  const rows = await db
    .select()
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db
    .update(galleryPhotos)
    .set({ position: rows[swap].position })
    .where(eq(galleryPhotos.id, rows[idx].id));
  await db
    .update(galleryPhotos)
    .set({ position: rows[idx].position })
    .where(eq(galleryPhotos.id, rows[swap].id));
  revalidatePath("/admin/photogallery");
  revalidatePath("/photogallery");
}

export async function removeGalleryPhoto(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const [row] = await db
    .select({ url: galleryPhotos.url })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.id, id));
  await db.delete(galleryPhotos).where(eq(galleryPhotos.id, id));
  if (row?.url) {
    try {
      await del(row.url);
    } catch {
      /* orphan/shared blob — ignore */
    }
  }
  revalidatePath("/admin/photogallery");
  revalidatePath("/photogallery");
}
