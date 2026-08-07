import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { readFile } from "node:fs/promises";
import { extname, basename } from "node:path";
import { asc, eq } from "drizzle-orm";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { db } from "../src/db";
import { pressArticles } from "../src/db/schema";

// Attaches a picture to a press article from a local file. The admin panel does
// the same job, but a server action tops out at a few megabytes on Vercel and a
// press photograph often runs larger, so this path talks to Blob directly.

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

async function main() {
  const [file, idArg] = process.argv.slice(2);
  if (!file) {
    console.error("usage: tsx scripts/set-press-image.ts <file> [articleId]");
    process.exit(1);
  }
  const contentType = MIME[extname(file).toLowerCase()];
  if (!contentType) {
    console.error(`Unsupported file type: ${extname(file)}`);
    process.exit(1);
  }

  const rows = await db
    .select()
    .from(pressArticles)
    .orderBy(asc(pressArticles.position), asc(pressArticles.id));
  const article = idArg
    ? rows.find((r) => r.id === Number(idArg))
    : rows[0];
  if (!article) {
    console.error(
      idArg ? `No article with id ${idArg}.` : "No press articles yet.",
    );
    process.exit(1);
  }

  const buf = await readFile(file);
  // Same treatment as the uploader: bake a JPEG's EXIF orientation into the
  // pixels so next/image cannot render it sideways.
  let body: Buffer = buf;
  let width: number;
  let height: number;
  if (contentType === "image/jpeg") {
    const { data, info } = await sharp(buf)
      .rotate()
      .toBuffer({ resolveWithObject: true });
    body = data;
    width = info.width;
    height = info.height;
  } else {
    const meta = await sharp(buf).metadata();
    width = meta.width ?? 0;
    height = meta.height ?? 0;
  }

  const ext = extname(file).toLowerCase().replace(".", "");
  const blob = await put(`press/article-${article.id}-${Date.now()}.${ext}`, body, {
    access: "public",
    contentType,
  });
  await db
    .update(pressArticles)
    .set({
      imageUrl: blob.url,
      imageWidth: width || null,
      imageHeight: height || null,
    })
    .where(eq(pressArticles.id, article.id));

  console.log(
    `${basename(file)} — ${width}x${height} → "${article.title}"\n${blob.url}`,
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
