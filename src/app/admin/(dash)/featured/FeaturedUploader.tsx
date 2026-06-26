"use client";

import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { addFeaturedImages } from "./actions";

export function FeaturedUploader() {
  const router = useRouter();
  return (
    <div className="rounded-[8px] border border-ink-200 bg-white p-5">
      <p className="mb-3 text-sm text-ink-600">
        Upload one or more images to add them to the homepage slider.
      </p>
      <ImageUploader
        multiple
        onUploaded={async (imgs) => {
          await addFeaturedImages(imgs);
          router.refresh();
        }}
      />
    </div>
  );
}
