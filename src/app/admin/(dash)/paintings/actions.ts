"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { paintings, photos, paintingVideos } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { paintingInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";
import { isSupportedVideoUrl } from "@/lib/video";

async function slugTaken(categoryId: number, exceptId?: number) {
  const rows = await db
    .select({ slug: paintings.slug, id: paintings.id })
    .from(paintings)
    .where(eq(paintings.categoryId, categoryId));
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createPainting(formData: FormData) {
  await requireAdmin();
  const data = paintingInput.parse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
  });
  const slug = uniqueSlug(slugify(data.title), await slugTaken(data.categoryId));
  const [row] = await db
    .insert(paintings)
    .values({
      title: data.title,
      description: data.description || null,
      categoryId: data.categoryId,
      slug,
    })
    .returning({ id: paintings.id });
  redirect(`/admin/paintings/${row.id}`);
}

// Result of the details form. A rejected save reports back to the form instead
// of throwing, so a typo (or an over-long field) never blanks the whole page
// and loses what the editor just typed.
export type SaveState = { ok: boolean; error?: string } | null;

export async function updatePainting(
  _prev: SaveState,
  formData: FormData,
): Promise<SaveState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const parsed = paintingInput.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
    categoryId: formData.get("categoryId"),
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      ok: false,
      error: `${issue.path.join(".") || "Form"}: ${issue.message}`,
    };
  }
  const data = parsed.data;
  const slug = uniqueSlug(
    slugify(data.title),
    await slugTaken(data.categoryId, id),
  );
  try {
    await db
      .update(paintings)
      .set({
        title: data.title,
        description: data.description || null,
        categoryId: data.categoryId,
        slug,
      })
      .where(eq(paintings.id, id));
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
  revalidatePath("/admin/paintings");
  revalidatePath("/");
  return { ok: true };
}

export async function deletePainting(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(paintings).where(eq(paintings.id, id)); // photos cascade
  revalidatePath("/admin/paintings");
  revalidatePath("/");
  redirect("/admin/paintings");
}

// Persist a new painting order (within a category, ← → buttons).
export async function reorderPaintings(orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(paintings)
      .set({ position: i })
      .where(eq(paintings.id, orderedIds[i]));
  }
  revalidatePath("/admin/paintings");
  revalidatePath("/");
}

export async function addPhoto(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const url = String(formData.get("url"));
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;
  const existing = await db
    .select()
    .from(photos)
    .where(eq(photos.paintingId, paintingId));
  await db
    .insert(photos)
    .values({ paintingId, url, width, height, position: existing.length });
  // first photo becomes the cover automatically
  if (existing.length === 0) {
    await db
      .update(paintings)
      .set({ coverPhotoUrl: url })
      .where(eq(paintings.id, paintingId));
  }
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

// Bulk add: insert several uploaded photos at once, preserving order.
export async function addPhotos(
  paintingId: number,
  imgs: { url: string; width: number; height: number }[],
) {
  await requireAdmin();
  if (!imgs.length) return;
  const existing = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.paintingId, paintingId));
  let pos = existing.length;
  for (const img of imgs) {
    await db.insert(photos).values({
      paintingId,
      url: img.url,
      width: img.width || null,
      height: img.height || null,
      position: pos++,
    });
  }
  // first ever photo becomes the cover automatically
  if (existing.length === 0 && imgs[0]) {
    await db
      .update(paintings)
      .set({ coverPhotoUrl: imgs[0].url })
      .where(eq(paintings.id, paintingId));
  }
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

// Persist a new photo order (drag & drop).
export async function reorderPhotos(paintingId: number, orderedIds: number[]) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(photos)
      .set({ position: i })
      .where(eq(photos.id, orderedIds[i]));
  }
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

export async function setCoverPhoto(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const url = String(formData.get("url"));
  await db
    .update(paintings)
    .set({ coverPhotoUrl: url })
    .where(eq(paintings.id, paintingId));
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

// One paste field for every provider: the URL alone says whether it's YouTube,
// Vimeo or Facebook, so there is nothing for the editor to pick.
export async function addPaintingVideo(
  paintingId: number,
  url: string,
  title: string,
) {
  await requireAdmin();
  const u = url.trim();
  if (!isSupportedVideoUrl(u)) throw new Error("Unsupported video URL");
  const existing = await db
    .select({ id: paintingVideos.id })
    .from(paintingVideos)
    .where(eq(paintingVideos.paintingId, paintingId));
  await db.insert(paintingVideos).values({
    paintingId,
    url: u,
    title: title.trim() || null,
    position: existing.length,
  });
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

export async function reorderPaintingVideos(
  paintingId: number,
  orderedIds: number[],
) {
  await requireAdmin();
  for (let i = 0; i < orderedIds.length; i++) {
    await db
      .update(paintingVideos)
      .set({ position: i })
      .where(eq(paintingVideos.id, orderedIds[i]));
  }
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

export async function removePaintingVideo(videoId: number, paintingId: number) {
  await requireAdmin();
  await db.delete(paintingVideos).where(eq(paintingVideos.id, videoId));
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}

export async function removePhoto(formData: FormData) {
  await requireAdmin();
  const photoId = Number(formData.get("photoId"));
  const paintingId = Number(formData.get("paintingId"));
  await db.delete(photos).where(eq(photos.id, photoId));
  revalidatePath(`/admin/paintings/${paintingId}`);
  revalidatePath("/");
}
