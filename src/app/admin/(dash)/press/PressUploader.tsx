"use client";

import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { addPressPhotos } from "./actions";

export function PressUploader() {
  const router = useRouter();
  return (
    <div className="rounded-[8px] border border-ink-200 bg-white p-5">
      <p className="mb-3 text-sm text-ink-600">
        Upload scans, cuttings or photographs to show below the articles.
      </p>
      <ImageUploader
        multiple
        onUploaded={async (imgs) => {
          await addPressPhotos(imgs);
          router.refresh();
        }}
      />
    </div>
  );
}
