import { asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, featured, siteSettings, photos } from "@/db/schema";

// A feature image (e.g. the Contact page): the highest-resolution portrait
// painting from the "Paintings" collection. Falls back gracefully to any
// portrait photo, then to the largest photo of any orientation.
export async function getFeatureImage() {
  const painting = await db
    .select({ url: photos.url })
    .from(photos)
    .innerJoin(paintings, eq(paintings.id, photos.paintingId))
    .innerJoin(categories, eq(categories.id, paintings.categoryId))
    .where(
      sql`${categories.slug} = 'paintings' and ${photos.width} is not null and ${photos.height} is not null and ${photos.height} >= ${photos.width}`,
    )
    .orderBy(desc(sql`${photos.width} * ${photos.height}`))
    .limit(1);
  if (painting[0]?.url) return painting[0].url;

  const portrait = await db
    .select({ url: photos.url })
    .from(photos)
    .where(
      sql`${photos.width} is not null and ${photos.height} is not null and ${photos.height} >= ${photos.width}`,
    )
    .orderBy(desc(sql`${photos.width} * ${photos.height}`))
    .limit(1);
  if (portrait[0]?.url) return portrait[0].url;

  const any = await db
    .select({ url: photos.url })
    .from(photos)
    .where(sql`${photos.width} is not null and ${photos.height} is not null`)
    .orderBy(desc(sql`${photos.width} * ${photos.height}`))
    .limit(1);
  return any[0]?.url ?? null;
}

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

  // Resolve any legacy painting-linked rows that lack a stored imageUrl.
  const needPainting = feat
    .filter((f) => !f.imageUrl && f.paintingId != null)
    .map((f) => f.paintingId as number);
  const byId = new Map<number, { coverPhotoUrl: string | null; title: string }>();
  if (needPainting.length) {
    const rows = await db
      .select()
      .from(paintings)
      .where(inArray(paintings.id, needPainting));
    rows.forEach((p) => byId.set(p.id, { coverPhotoUrl: p.coverPhotoUrl, title: p.title }));
  }

  return feat
    .map((f) => {
      if (f.imageUrl) return { url: f.imageUrl, title: f.title ?? "" };
      const p = f.paintingId != null ? byId.get(f.paintingId) : undefined;
      if (p?.coverPhotoUrl) return { url: p.coverPhotoUrl, title: p.title };
      return null;
    })
    .filter((s): s is { url: string; title: string } => !!s);
}
