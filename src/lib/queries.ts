import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  categories,
  paintings,
  featured,
  siteSettings,
  photos,
  galleryPhotos,
  videos,
  paintingVideos,
  pressArticles,
  pressPhotos,
} from "@/db/schema";

export type Cover = {
  url: string;
  width: number | null;
  height: number | null;
};

// A work with no photographs of its own stands on its video: the frame grabbed
// when the file was uploaded becomes its cover, so it still earns a card in the
// grid instead of being dropped.
export async function videoCovers(
  paintingIds: number[],
): Promise<Map<number, Cover>> {
  const covers = new Map<number, Cover>();
  if (!paintingIds.length) return covers;
  const rows = await db
    .select({
      paintingId: paintingVideos.paintingId,
      url: paintingVideos.posterUrl,
      width: paintingVideos.posterWidth,
      height: paintingVideos.posterHeight,
    })
    .from(paintingVideos)
    .where(
      and(
        inArray(paintingVideos.paintingId, paintingIds),
        isNotNull(paintingVideos.posterUrl),
      ),
    )
    .orderBy(asc(paintingVideos.position), asc(paintingVideos.id));
  // First video wins — the list is already in the order the admin arranged.
  for (const r of rows) {
    if (!covers.has(r.paintingId)) {
      covers.set(r.paintingId, {
        url: r.url!,
        width: r.width,
        height: r.height,
      });
    }
  }
  return covers;
}

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

export async function getGalleryPhotos() {
  return db
    .select()
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.position), asc(galleryPhotos.id));
}

export async function getPressArticles() {
  return db
    .select()
    .from(pressArticles)
    .orderBy(asc(pressArticles.position), asc(pressArticles.id));
}

export async function getPressPhotos() {
  return db
    .select()
    .from(pressPhotos)
    .orderBy(asc(pressPhotos.position), asc(pressPhotos.id));
}

export async function getVideos() {
  return db
    .select()
    .from(videos)
    .orderBy(asc(videos.position), asc(videos.id));
}

export async function getAllWorks() {
  const cats = await db
    .select()
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
  const catById = new Map(cats.map((c) => [c.id, c]));
  const works = await db
    .select({
      id: paintings.id,
      title: paintings.title,
      slug: paintings.slug,
      categoryId: paintings.categoryId,
      coverPhotoUrl: paintings.coverPhotoUrl,
      // the cover's own dimensions, so a work can be shown in its real shape
      coverWidth: photos.width,
      coverHeight: photos.height,
    })
    .from(paintings)
    .leftJoin(
      photos,
      and(
        eq(photos.paintingId, paintings.id),
        eq(photos.url, paintings.coverPhotoUrl),
      ),
    )
    .orderBy(asc(paintings.position), asc(paintings.title));
  const fallbacks = await videoCovers(
    works.filter((p) => !p.coverPhotoUrl).map((p) => p.id),
  );
  return works
    .map((p) => ({ ...p, cover: coverFor(p, fallbacks) }))
    .filter((p) => !!p.cover && catById.has(p.categoryId))
    .map((p) => {
      const cat = catById.get(p.categoryId)!;
      return {
        title: p.title,
        slug: p.slug,
        coverPhotoUrl: p.cover!.url,
        coverWidth: p.cover!.width,
        coverHeight: p.cover!.height,
        categoryName: cat.name,
        categorySlug: cat.slug,
        categoryPosition: cat.position,
      };
    })
    // Order by category position (matching the admin Categories order), keeping
    // painting order within each category — sort is stable. This drives both the
    // portfolio filter tabs and the "All" category cards.
    .sort((a, b) => a.categoryPosition - b.categoryPosition);
}

// The work's own cover if it has one, otherwise its video's opening frame.
export function coverFor(
  p: {
    id: number;
    coverPhotoUrl: string | null;
    coverWidth: number | null;
    coverHeight: number | null;
  },
  fallbacks: Map<number, Cover>,
): Cover | null {
  if (p.coverPhotoUrl) {
    return { url: p.coverPhotoUrl, width: p.coverWidth, height: p.coverHeight };
  }
  return fallbacks.get(p.id) ?? null;
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
