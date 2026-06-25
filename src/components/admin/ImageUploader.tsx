"use client";
import { useState } from "react";
import { uploadImageAction } from "@/app/admin/(dash)/_actions/upload";

export function ImageUploader({
  onUploaded,
}: {
  onUploaded: (img: { url: string; width: number; height: number }) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <input
        type="file"
        accept="image/*"
        disabled={busy}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setBusy(true);
          setErr(null);
          const fd = new FormData();
          fd.set("file", file);
          const res = await uploadImageAction(fd);
          setBusy(false);
          if ("error" in res) setErr(res.error);
          else onUploaded(res);
          e.target.value = "";
        }}
      />
      {busy && <span className="ml-2 text-sm">Uploading…</span>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
