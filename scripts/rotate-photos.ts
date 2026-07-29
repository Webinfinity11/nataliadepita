// Rotate the photos of a category 90° counter-clockwise ("left").
//
// Scans originate from the old WordPress site; some collections were stored
// sideways (portrait files of landscape works). This re-encodes the affected
// files, uploads them under a new blob key, and repoints the database.
// Originals are left in blob storage, so a run is reversible.
//
//   npx tsx --env-file=.env.local scripts/rotate-photos.ts black-white --dry
//   npx tsx --env-file=.env.local scripts/rotate-photos.ts black-white
//
// By default only portrait photos (height > width) are rotated; pass --all to
// rotate every photo in the category.
import { put } from "@vercel/blob";
import sharp from "sharp";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { categories, featured, paintings, photos } from "@/db/schema";

const [slug, ...flags] = process.argv.slice(2);
const dry = flags.includes("--dry");
const all = flags.includes("--all");

if (!slug) {
  console.error("usage: rotate-photos.ts <category-slug> [--dry] [--all]");
  process.exit(1);
}

async function main() {
  const [cat] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (!cat) throw new Error(`no category with slug "${slug}"`);

  const rows = await db
    .select({
      photoId: photos.id,
      url: photos.url,
      width: photos.width,
      height: photos.height,
      paintingId: paintings.id,
      title: paintings.title,
      cover: paintings.coverPhotoUrl,
    })
    .from(photos)
    .innerJoin(paintings, eq(paintings.id, photos.paintingId))
    .where(
      all
        ? eq(paintings.categoryId, cat.id)
        : and(
            eq(paintings.categoryId, cat.id),
            sql`${photos.height} > ${photos.width}`,
          ),
    )
    .orderBy(paintings.position);

  console.log(`${cat.name}: ${rows.length} photo(s) to rotate left${dry ? " (dry run)" : ""}`);

  for (const r of rows) {
    const res = await fetch(r.url);
    if (!res.ok) throw new Error(`fetch failed (${res.status}) for ${r.url}`);
    const input = Buffer.from(await res.arrayBuffer());

    // rotate(-90) is counter-clockwise; .rotate() also bakes in EXIF orientation
    const output = await sharp(input).rotate(-90).jpeg({ quality: 92 }).toBuffer();
    const meta = await sharp(output).metadata();
    const width = meta.width ?? r.height ?? null;
    const height = meta.height ?? r.width ?? null;

    // paintings/1783586667699-6-494.jpg → paintings/1783586667699-6-494-rot90ccw.jpg
    const path = new URL(r.url).pathname.replace(/^\//, "");
    const key = path.replace(/(\.\w+)$/, "-rot90ccw$1");

    console.log(
      `  ${r.title}: ${r.width}×${r.height} → ${width}×${height}  ${key}`,
    );
    if (dry) continue;

    const blob = await put(key, output, {
      access: "public",
      contentType: "image/jpeg",
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    await db
      .update(photos)
      .set({ url: blob.url, width, height })
      .where(eq(photos.id, r.photoId));

    if (r.cover === r.url) {
      await db
        .update(paintings)
        .set({ coverPhotoUrl: blob.url })
        .where(eq(paintings.id, r.paintingId));
    }

    // homepage slider rows may point at the same file
    await db
      .update(featured)
      .set({ imageUrl: blob.url, width, height })
      .where(eq(featured.imageUrl, r.url));
  }

  console.log(dry ? "dry run — nothing written" : "done");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
