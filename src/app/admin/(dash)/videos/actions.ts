"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { isSupportedVideoUrl } from "@/lib/video";

export async function addVideo(url: string, title: string) {
  await requireAdmin();
  const u = url.trim();
  if (!isSupportedVideoUrl(u)) throw new Error("Unsupported video URL");
  const rows = await db.select({ id: videos.id }).from(videos);
  await db.insert(videos).values({
    url: u,
    title: title.trim() || null,
    position: rows.length,
  });
  revalidatePath("/admin/videos");
  revalidatePath("/videos");
}

export async function moveVideo(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"
  const rows = await db.select().from(videos).orderBy(asc(videos.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db
    .update(videos)
    .set({ position: rows[swap].position })
    .where(eq(videos.id, rows[idx].id));
  await db
    .update(videos)
    .set({ position: rows[idx].position })
    .where(eq(videos.id, rows[swap].id));
  revalidatePath("/admin/videos");
  revalidatePath("/videos");
}

export async function removeVideo(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(videos).where(eq(videos.id, id));
  revalidatePath("/admin/videos");
  revalidatePath("/videos");
}
