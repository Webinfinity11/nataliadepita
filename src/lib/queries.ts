import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, featured, siteSettings } from "@/db/schema";

export async function getNavCategories() {
  return db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
}

export async function getSettings() {
  const [s] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1));
  return s;
}

export async function getAllWorks() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
  const catById = new Map(cats.map((c) => [c.id, c]));
  const works = await db
    .select()
    .from(paintings)
    .orderBy(asc(paintings.position), asc(paintings.title));
  return works
    .filter((p) => !!p.coverPhotoUrl && catById.has(p.categoryId))
    .map((p) => {
      const cat = catById.get(p.categoryId)!;
      return {
        title: p.title,
        slug: p.slug,
        coverPhotoUrl: p.coverPhotoUrl!,
        categoryName: cat.name,
        categorySlug: cat.slug,
      };
    });
}

export async function getFeaturedSlides() {
  const feat = await db.select().from(featured).orderBy(asc(featured.position));
  if (!feat.length) return [];
  const rows = await db
    .select()
    .from(paintings)
    .where(
      inArray(
        paintings.id,
        feat.map((f) => f.paintingId),
      ),
    );
  const byId = new Map(rows.map((p) => [p.id, p]));
  return feat
    .map((f) => byId.get(f.paintingId))
    .filter((p): p is NonNullable<typeof p> => !!p && !!p.coverPhotoUrl)
    .map((p) => ({ url: p.coverPhotoUrl!, title: p.title }));
}
