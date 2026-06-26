"use client";
import { useState } from "react";
import { uploadImageAction } from "@/app/admin/(dash)/_actions/upload";

type Img = { url: string; width: number; height: number };

export function ImageUploader({
  onUploaded,
  multiple = false,
}: {
  onUploaded: (imgs: Img[]) => void | Promise<void>;
  multiple?: boolean;
}) {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(
    null,
  );
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-dashed border-ink-300 bg-white px-4 py-2.5 text-sm text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {busy
          ? progress
            ? `Uploading ${progress.done}/${progress.total}…`
            : "Uploading…"
          : multiple
            ? "Upload photos"
            : "Upload photo"}
        <input
          type="file"
          accept="image/*"
          multiple={multiple}
          disabled={busy}
          className="hidden"
          onChange={async (e) => {
            const files = Array.from(e.target.files ?? []);
            if (!files.length) return;
            setBusy(true);
            setErr(null);
            setProgress({ done: 0, total: files.length });
            const out: Img[] = [];
            for (let i = 0; i < files.length; i++) {
              const fd = new FormData();
              fd.set("file", files[i]);
              const res = await uploadImageAction(fd);
              if ("error" in res) setErr(res.error);
              else out.push(res);
              setProgress({ done: i + 1, total: files.length });
            }
            e.target.value = "";
            if (out.length) await onUploaded(out);
            setBusy(false);
            setProgress(null);
          }}
        />
      </label>
      {multiple && !busy && (
        <p className="text-xs text-ink-400">
          You can select several images at once.
        </p>
      )}
      {err && <p className="text-sm text-danger-600">{err}</p>}
    </div>
  );
}
