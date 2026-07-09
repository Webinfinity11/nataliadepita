"use client";

import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { addGalleryPhotos } from "./actions";

export function PhotogalleryUploader() {
  const router = useRouter();
  return (
    <div className="rounded-[8px] border border-ink-200 bg-white p-5">
      <p className="mb-3 text-sm text-ink-600">
        Upload one or more photos to add them to the gallery.
      </p>
      <ImageUploader
        multiple
        onUploaded={async (imgs) => {
          await addGalleryPhotos(imgs);
          router.refresh();
        }}
      />
    </div>
  );
}
