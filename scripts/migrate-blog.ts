import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { put } from "@vercel/blob";
import { Agent } from "undici";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { blogPosts } from "../src/db/schema";
import { slugify, uniqueSlug } from "../src/lib/slug";
import { WP_BASE } from "./wp-map";

// The old site serves a self-signed cert. Scope the relaxed TLS check to ONLY
// the legacy host via a dedicated undici dispatcher — the Neon DB and Blob
// writes keep full TLS verification (see migrate-wordpress.ts for the rationale).
const legacyAgent = new Agent({ connect: { rejectUnauthorized: false } });
const wpFetch = (url: string) =>
  fetch(url, { dispatcher: legacyAgent } as RequestInit);

// WordPress REST API, accessed via the ?rest_route= fallback (pretty
// permalinks for REST are disabled on this install).
const REST = (route: string) =>
  `${WP_BASE}/?rest_route=${encodeURIComponent(route)}`;

const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  rdquo: "”",
  ldquo: "“",
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, name) => NAMED[name.toLowerCase()] ?? m);
}

async function uploadFromUrl(url: string): Promise<string | null> {
  try {
    const res = await wpFetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const name = (url.split("/").pop() ?? `img-${Date.now()}`).split("?")[0];
    const blob = await put(`migrated/blog/${Date.now()}-${name}`, buf, {
      access: "public",
    });
    return blob.url;
  } catch (e) {
    console.warn("  skip image", url, (e as Error).message);
    return null;
  }
}

// Collect uploads/* image URLs embedded in post HTML so they can be rehosted.
function inlineImageUrls(html: string): string[] {
  const re =
    /https?:\/\/[^"'\s)]*wp-content\/uploads\/[^"'\s)]+\.(?:jpe?g|png|gif|webp)/gi;
  return Array.from(new Set(html.match(re) ?? []));
}

type WpPost = {
  id: number;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: { "wp:featuredmedia"?: { source_url?: string }[] };
};

async function main() {
  const res = await wpFetch(REST("/wp/v2/posts") + "&per_page=100&_embed=1");
  if (!res.ok) throw new Error(`posts fetch failed: HTTP ${res.status}`);
  const posts = (await res.json()) as WpPost[];
  console.log(`Fetched ${posts.length} posts.`);

  const taken = (
    await db.select({ slug: blogPosts.slug }).from(blogPosts)
  ).map((r) => r.slug);

  for (const post of posts) {
    const title = decodeEntities(post.title.rendered).trim() || `post-${post.id}`;
    const slug = uniqueSlug(slugify(title), taken);

    // Idempotency: skip if a post with this exact title already migrated.
    const [dupe] = await db
      .select({ id: blogPosts.id })
      .from(blogPosts)
      .where(eq(blogPosts.title, title));
    if (dupe) {
      console.log(`= skip (exists): ${title}`);
      continue;
    }
    taken.push(slug);

    // Featured image → cover.
    const featured = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
    const coverPhotoUrl = featured ? await uploadFromUrl(featured) : null;

    // Rehost inline images and rewrite their URLs in the body.
    let body = post.content.rendered;
    for (const url of inlineImageUrls(body)) {
      const hosted = await uploadFromUrl(url);
      if (hosted) body = body.split(url).join(hosted);
    }

    await db.insert(blogPosts).values({
      title,
      slug,
      coverPhotoUrl,
      body,
      status: "published",
      publishedAt: new Date(post.date),
    });
    console.log(`+ ${title}  (cover: ${coverPhotoUrl ? "yes" : "no"})`);
  }

  console.log("Blog migration complete.");
}

main().then(() => process.exit(0));
