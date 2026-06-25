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
  const meta = await sharp(buf).metadata();
  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `paintings/${Date.now()}-${Math.round(meta.width ?? 0)}.${ext}`;
  const blob = await put(key, buf, { access: "public", contentType: file.type });
  return { url: blob.url, width: meta.width ?? 0, height: meta.height ?? 0 };
}
