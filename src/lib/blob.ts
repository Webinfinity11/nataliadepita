import { put } from "@vercel/blob";
import sharp from "sharp";
import { isAllowedImage } from "./validation";

export async function uploadImage(
  file: File,
): Promise<{ url: string; width: number; height: number }> {
  if (!isAllowedImage({ type: file.type, size: file.size })) {
    throw new Error("Unsupported or oversized image");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const ext = file.type.split("/")[1] ?? "jpg";
  const keyFor = (w: number) => `paintings/${Date.now()}-${Math.round(w)}.${ext}`;

  // JPEGs can carry an EXIF orientation tag; browsers and next/image handle it
  // inconsistently, which shows photos rotated. Bake the orientation into the
  // pixels (and read the corrected dimensions) so images always display upright.
  // Other formats (png/webp/gif) have no orientation tag — leave them untouched
  // so animated GIFs keep animating.
  if (file.type === "image/jpeg") {
    const { data, info } = await sharp(buf)
      .rotate()
      .toBuffer({ resolveWithObject: true });
    const blob = await put(keyFor(info.width), data, {
      access: "public",
      contentType: file.type,
    });
    return { url: blob.url, width: info.width, height: info.height };
  }

  const meta = await sharp(buf).metadata();
  const blob = await put(keyFor(meta.width ?? 0), buf, {
    access: "public",
    contentType: file.type,
  });
  return { url: blob.url, width: meta.width ?? 0, height: meta.height ?? 0 };
}
