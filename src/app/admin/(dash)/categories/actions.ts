"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
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

export async function reorderCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const position = Number(formData.get("position"));
  await db
    .update(categories)
    .set({ position })
    .where(eq(categories.id, id));
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
