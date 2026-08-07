"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isSupportedVideoUrl } from "@/lib/video";
import { uploadVideoWithPoster } from "@/lib/video-upload";
import { addVideo } from "./actions";

export function VideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isSupportedVideoUrl(url)) {
      setErr("Enter a valid YouTube, Vimeo or Facebook link.");
      return;
    }
    setBusy(true);
    try {
      await addVideo(url, title);
      setUrl("");
      setTitle("");
      router.refresh();
    } catch {
      setErr("Could not add the video. Check the link and try again.");
    } finally {
      setBusy(false);
    }
  }

  // The file goes straight from the browser to Blob storage — a server action
  // tops out at a few megabytes on Vercel, and video is never that small.
  async function upload(file: File) {
    setErr(null);
    setBusy(true);
    setProgress(0);
    try {
      const uploaded = await uploadVideoWithPoster(file, setProgress, "videos");
      await addVideo("", title, uploaded);
      setTitle("");
      router.refresh();
    } catch {
      setErr("Upload failed. Try again, or use a smaller file.");
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="space-y-3 rounded-[8px] border border-ink-200 bg-white p-4">
      <form onSubmit={submit} className="flex flex-wrap items-start gap-3">
        <div className="min-w-[220px] flex-1">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="YouTube, Vimeo or Facebook link"
            className="w-full"
          />
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          className="min-w-[180px] flex-1"
        />
        <button
          disabled={busy || !url}
          className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add"}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-3 border-t border-ink-100 pt-3">
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-dashed border-ink-300 px-4 py-2 text-sm text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 ${
            busy ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {progress !== null
            ? `Uploading ${Math.round(progress)}%…`
            : "…or upload a video file"}
          <input
            type="file"
            accept="video/*"
            disabled={busy}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (file) upload(file);
            }}
          />
        </label>
        <span className="text-xs text-ink-400">
          The title above is used for the upload too. The opening frame becomes
          the poster.
        </span>
      </div>

      {err && <p className="text-sm text-danger-600">{err}</p>}
    </div>
  );
}
