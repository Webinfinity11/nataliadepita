"use client";
import { upload } from "@vercel/blob/client";

const HANDLE_URL = "/api/blob/upload";

export type UploadedVideo = {
  url: string;
  posterUrl: string | null;
  posterWidth: number | null;
  posterHeight: number | null;
};

// Grab the opening frame so a work with no photographs still has something to
// show on its card. Seeks a fraction in rather than to 0 — the very first frame
// of a clip is often black.
export async function firstFrame(file: File): Promise<Blob | null> {
  const video = document.createElement("video");
  video.preload = "metadata";
  video.muted = true;
  video.playsInline = true;
  const objectUrl = URL.createObjectURL(file);
  video.src = objectUrl;

  try {
    await once(video, "loadeddata");
    video.currentTime = Math.min(0.1, (video.duration || 1) / 10);
    await once(video, "seeked");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    if (!canvas.width || !canvas.height) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.86),
    );
  } catch {
    // A codec the browser can't decode still uploads fine — it just has no
    // poster, and the card falls back to the title alone.
    return null;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function uploadVideoWithPoster(
  file: File,
  onProgress?: (percent: number) => void,
): Promise<UploadedVideo> {
  const poster = await firstFrame(file);
  let size: { width: number; height: number } | null = null;
  if (poster) size = await imageSize(poster);

  const blob = await upload(safeName(file.name), file, {
    access: "public",
    handleUploadUrl: HANDLE_URL,
    onUploadProgress: onProgress
      ? ({ percentage }) => onProgress(percentage)
      : undefined,
  });

  let posterUrl: string | null = null;
  if (poster) {
    const p = await upload(
      safeName(file.name.replace(/\.[^.]+$/, "") + "-poster.jpg"),
      poster,
      { access: "public", handleUploadUrl: HANDLE_URL, contentType: "image/jpeg" },
    );
    posterUrl = p.url;
  }

  return {
    url: blob.url,
    posterUrl,
    posterWidth: size?.width ?? null,
    posterHeight: size?.height ?? null,
  };
}

function safeName(name: string) {
  const clean = name.replace(/[^\w.-]+/g, "-").slice(-80);
  return `painting-videos/${clean || "video"}`;
}

function once(el: HTMLVideoElement, event: string) {
  return new Promise<void>((resolve, reject) => {
    const ok = () => {
      cleanup();
      resolve();
    };
    const bad = () => {
      cleanup();
      reject(new Error(`video ${event} failed`));
    };
    const cleanup = () => {
      el.removeEventListener(event, ok);
      el.removeEventListener("error", bad);
    };
    el.addEventListener(event, ok, { once: true });
    el.addEventListener("error", bad, { once: true });
  });
}

function imageSize(blob: Blob) {
  return new Promise<{ width: number; height: number } | null>((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}
