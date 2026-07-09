"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { isSupportedVideoUrl } from "@/lib/video";
import { addVideo } from "./actions";

export function VideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!isSupportedVideoUrl(url)) {
      setErr("Enter a valid YouTube or Vimeo link.");
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

  return (
    <form
      onSubmit={submit}
      className="flex flex-wrap items-start gap-3 rounded-[8px] border border-ink-200 bg-white p-4"
    >
      <div className="min-w-[220px] flex-1">
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="YouTube or Vimeo link"
          className="w-full"
          required
        />
        {err && <p className="mt-1.5 text-xs text-danger-600">{err}</p>}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="min-w-[180px] flex-1"
      />
      <button
        disabled={busy}
        className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 disabled:opacity-60"
      >
        {busy ? "Adding…" : "Add"}
      </button>
    </form>
  );
}
