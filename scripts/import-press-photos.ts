import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join } from "node:path";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { db } from "../src/db";
import { pressPhotos } from "../src/db/schema";

// Bulk-import the press cuttings and photographs from a local folder. The admin
// uploader posts each file through a server action, which on Vercel tops out at
// a few megabytes; scans routinely run larger than that, so this path talks to
// Blob storage directly and writes the rows itself.

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

async function main() {
  const [folder, ...flags] = process.argv.slice(2);
  const dry = flags.includes("--dry");
  if (!folder) {
    console.error(
      "usage: tsx scripts/import-press-photos.ts <folder> [--dry]",
    );
    process.exit(1);
  }

  const names = (await readdir(folder))
    .filter((n) => MIME[extname(n).toLowerCase()])
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  if (!names.length) {
    console.error(`No images in ${folder} (looked for jpg/png/webp/gif).`);
    process.exit(1);
  }

  const existing = await db.select({ id: pressPhotos.id }).from(pressPhotos);
  let pos = existing.length;
  console.log(
    `${names.length} image(s) to import; press gallery already holds ${existing.length}.`,
  );

  for (const name of names) {
    const path = join(folder, name);
    const contentType = MIME[extname(name).toLowerCase()];
    const { size } = await stat(path);
    const buf = await readFile(path);

    // Same treatment as the admin uploader: bake a JPEG's EXIF orientation into
    // the pixels so next/image can't render it sideways. Other formats carry no
    // orientation tag, so they pass through untouched (animated GIFs survive).
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

    const mb = (size / 1024 / 1024).toFixed(1);
    if (dry) {
      console.log(`  would upload ${name} — ${width}x${height}, ${mb} MB`);
      pos++;
      continue;
    }

    const ext = extname(name).toLowerCase().replace(".", "");
    const blob = await put(`press/${Date.now()}-${pos}.${ext}`, body, {
      access: "public",
      contentType,
    });
    await db.insert(pressPhotos).values({
      url: blob.url,
      width: width || null,
      height: height || null,
      position: pos++,
    });
    console.log(`  ${name} — ${width}x${height}, ${mb} MB → ${blob.url}`);
  }

  console.log(
    dry
      ? "Dry run — nothing uploaded."
      : "Done. Reorder or remove any of them under Admin → Press.",
  );
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
