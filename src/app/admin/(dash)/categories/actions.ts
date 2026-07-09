"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { categoryInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";

async function takenSlugs(exceptId?: number) {
  const rows = await db
    .select({ slug: categories.slug, id: categories.id })
    .from(categories);
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const data = categoryInput.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  const slug = uniqueSlug(slugify(data.name), await takenSlugs());
  await db
    .insert(categories)
    .values({ name: data.name, slug, description: data.description || null });
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = categoryInput.parse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
  });
  const slug = uniqueSlug(slugify(data.name), await takenSlugs(id));
  await db
    .update(categories)
    .set({ name: data.name, slug, description: data.description || null })
    .where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  // paintings.categoryId is FK-restrict, so a category with works can't be
  // dropped directly. Remove its paintings first (photos and featured rows
  // cascade off the painting FKs), then the category itself. The destructive
  // intent is confirmed client-side before this runs.
  await db.delete(paintings).where(eq(paintings.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}

export async function moveCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;

  // Load in the same order the page/front-end display them.
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));

  const idx = rows.findIndex((r) => r.id === id);
  const swap = idx + dir;
  if (idx === -1 || swap < 0 || swap >= rows.length) return; // at an edge → no-op

  [rows[idx], rows[swap]] = [rows[swap], rows[idx]];

  // Re-number every row 0..n so ordering is stable even when positions were
  // all 0 (the pre-existing default). One update per row keeps this simple.
  await Promise.all(
    rows.map((r, i) =>
      db.update(categories).set({ position: i }).where(eq(categories.id, r.id)),
    ),
  );

  revalidatePath("/admin/categories");
  revalidatePath("/");
}
