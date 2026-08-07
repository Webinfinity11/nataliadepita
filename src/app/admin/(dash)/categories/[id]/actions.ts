"use server";
import { revalidatePath } from "next/cache";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, projectSections } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

async function refresh(categoryId: number) {
  const [cat] = await db
    .select({ slug: categories.slug })
    .from(categories)
    .where(eq(categories.id, categoryId));
  revalidatePath(`/admin/categories/${categoryId}`);
  if (cat) revalidatePath(`/${cat.slug}`);
}

export async function addSection(formData: FormData) {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!categoryId || !title) return;
  const style = formData.get("style") === "group" ? "group" : "project";
  const rows = await db
    .select({ id: projectSections.id })
    .from(projectSections)
    .where(eq(projectSections.categoryId, categoryId));
  await db.insert(projectSections).values({
    categoryId,
    title,
    subtitle: String(formData.get("subtitle") ?? "").trim() || null,
    body: String(formData.get("body") ?? "").trim() || null,
    style,
    position: rows.length,
  });
  await refresh(categoryId);
}

export async function updateSection(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const categoryId = Number(formData.get("categoryId"));
  const title = String(formData.get("title") ?? "").trim();
  if (!id || !title) return;
  await db
    .update(projectSections)
    .set({
      title,
      subtitle: String(formData.get("subtitle") ?? "").trim() || null,
      body: String(formData.get("body") ?? "").trim() || null,
      style: formData.get("style") === "group" ? "group" : "project",
    })
    .where(eq(projectSections.id, id));
  await refresh(categoryId);
}

export async function moveSection(formData: FormData) {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const id = Number(formData.get("id"));
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const rows = await db
    .select({ id: projectSections.id })
    .from(projectSections)
    .where(eq(projectSections.categoryId, categoryId))
    .orderBy(asc(projectSections.position), asc(projectSections.id));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = idx + dir;
  if (idx === -1 || swap < 0 || swap >= rows.length) return;
  [rows[idx], rows[swap]] = [rows[swap], rows[idx]];
  // Re-number the lot, so an order set before positions existed still settles.
  await Promise.all(
    rows.map((r, i) =>
      db
        .update(projectSections)
        .set({ position: i })
        .where(eq(projectSections.id, r.id)),
    ),
  );
  await refresh(categoryId);
}

// Dropping a section leaves its works alone — section_id is set null by the
// foreign key, so they reappear under the category rather than vanishing.
export async function removeSection(formData: FormData) {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const id = Number(formData.get("id"));
  await db.delete(projectSections).where(eq(projectSections.id, id));
  await refresh(categoryId);
}

// One save for the whole category: every work carries a select naming its
// section, which beats opening sixty works one at a time.
export async function assignWorks(formData: FormData) {
  await requireAdmin();
  const categoryId = Number(formData.get("categoryId"));
  const works = await db
    .select({ id: paintings.id, sectionId: paintings.sectionId })
    .from(paintings)
    .where(eq(paintings.categoryId, categoryId));
  const valid = new Set(
    (
      await db
        .select({ id: projectSections.id })
        .from(projectSections)
        .where(eq(projectSections.categoryId, categoryId))
    ).map((s) => s.id),
  );

  const byTarget = new Map<number | null, number[]>();
  for (const w of works) {
    const raw = formData.get(`section-${w.id}`);
    if (raw === null) continue; // not on the form — leave it as it is
    const next = Number(raw);
    const target = valid.has(next) ? next : null;
    if (target === w.sectionId) continue;
    const bucket = byTarget.get(target) ?? [];
    bucket.push(w.id);
    byTarget.set(target, bucket);
  }
  for (const [target, ids] of byTarget) {
    await db
      .update(paintings)
      .set({ sectionId: target })
      .where(inArray(paintings.id, ids));
  }
  await refresh(categoryId);
}
