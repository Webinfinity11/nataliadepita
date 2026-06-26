"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { featured } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

// Add one or more directly-uploaded images as slides.
export async function addFeaturedImages(
  imgs: { url: string; width: number; height: number; title?: string }[],
) {
  await requireAdmin();
  if (!imgs.length) return;
  const rows = await db.select().from(featured);
  let pos = rows.length;
  for (const img of imgs) {
    await db.insert(featured).values({
      imageUrl: img.url,
      title: img.title || null,
      width: img.width || null,
      height: img.height || null,
      position: pos++,
    });
  }
  revalidatePath("/admin/featured");
  revalidatePath("/");
}

export async function setFeaturedTitle(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const title = String(formData.get("title") ?? "").trim();
  await db
    .update(featured)
    .set({ title: title || null })
    .where(eq(featured.id, id));
  revalidatePath("/admin/featured");
  revalidatePath("/");
}

export async function removeFeatured(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(featured).where(eq(featured.id, id));
  revalidatePath("/admin/featured");
  revalidatePath("/");
}

export async function moveFeatured(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"
  const rows = await db.select().from(featured).orderBy(asc(featured.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db
    .update(featured)
    .set({ position: rows[swap].position })
    .where(eq(featured.id, rows[idx].id));
  await db
    .update(featured)
    .set({ position: rows[idx].position })
    .where(eq(featured.id, rows[swap].id));
  revalidatePath("/admin/featured");
  revalidatePath("/");
}
