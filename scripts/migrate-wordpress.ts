import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { put } from "@vercel/blob";
import sharp from "sharp";
import { Agent } from "undici";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { categories, paintings, photos } from "../src/db/schema";
import { slugify, uniqueSlug } from "../src/lib/slug";
import { WP_BASE, PAGE_TO_CATEGORY } from "./wp-map";

// The old site serves a self-signed cert. Rather than disable TLS process-wide
// (NODE_TLS_REJECT_UNAUTHORIZED=0, which exposes ALL connections to MITM — e.g.
// the Neon DB and Vercel Blob writes below), scope the relaxed check to ONLY the
// fetches against the legacy host via a dedicated undici dispatcher. The DB and
// Blob calls keep full TLS verification.
const legacyAgent = new Agent({ connect: { rejectUnauthorized: false } });
const wpFetch = (url: string) =>
  fetch(url, { dispatcher: legacyAgent } as RequestInit);

async function getOrCreateCategory(name: string, position: number) {
  const slug = slugify(name);
  const [existing] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, slug));
  if (existing) return existing;
  const [row] = await db
    .insert(categories)
    .values({ name, slug, position })
    .returning();
  return row;
}

function extractImageUrls(html: string): string[] {
  const re =
    /https?:\/\/[^"'\s]*wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|gif|webp)/gi;
  const all = html.match(re) ?? [];
  // strip WordPress size suffixes like -300x200 to prefer the full image
  const full = all.map((u) => u.replace(/-\d+x\d+(\.\w+)$/i, "$1"));
  return Array.from(new Set(full));
}

async function uploadFromUrl(
  url: string,
): Promise<{ url: string; width: number; height: number } | null> {
  try {
    const res = await wpFetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    const name = url.split("/").pop() ?? `img-${Date.now()}.jpg`;
    const blob = await put(`migrated/${Date.now()}-${name}`, buf, {
      access: "public",
    });
    return { url: blob.url, width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch (e) {
    console.warn("skip", url, (e as Error).message);
    return null;
  }
}

async function main() {
for (const [i, { pageId, category }] of PAGE_TO_CATEGORY.entries()) {
  const cat = await getOrCreateCategory(category, i);
  const res = await wpFetch(`${WP_BASE}/?page_id=${pageId}`);
  const html = await res.text();
  const urls = extractImageUrls(html);
  console.log(`Page ${pageId} → ${category}: ${urls.length} images`);

  const existingSlugs = (
    await db
      .select({ slug: paintings.slug })
      .from(paintings)
      .where(eq(paintings.categoryId, cat.id))
  ).map((r) => r.slug);

  for (const url of urls) {
    const uploaded = await uploadFromUrl(url);
    if (!uploaded) continue;
    const baseName = (url.split("/").pop() ?? "untitled")
      .replace(/\.\w+$/, "")
      .replace(/[-_]+/g, " ");
    const slug = uniqueSlug(slugify(baseName), existingSlugs);
    existingSlugs.push(slug);
    const [painting] = await db
      .insert(paintings)
      .values({
        title: baseName,
        slug,
        categoryId: cat.id,
        coverPhotoUrl: uploaded.url,
      })
      .returning({ id: paintings.id });
    await db.insert(photos).values({
      paintingId: painting.id,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      position: 0,
    });
  }
}
console.log("Migration complete.");
}

main().then(() => process.exit(0));
