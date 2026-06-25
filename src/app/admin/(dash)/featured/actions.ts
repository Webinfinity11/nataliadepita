"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { featured } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function addFeatured(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const rows = await db.select().from(featured);
  if (rows.some((r) => r.paintingId === paintingId)) return;
  await db.insert(featured).values({ paintingId, position: rows.length });
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
