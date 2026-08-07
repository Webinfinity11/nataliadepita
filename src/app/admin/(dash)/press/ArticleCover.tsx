"use client";

import { useRouter } from "next/navigation";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { setPressArticleImage } from "./actions";

// The picture shown beside an article on the public page. Kept next to the row
// it belongs to, so it is obvious which headline is being illustrated.
export function ArticleCover({
  articleId,
  imageUrl,
}: {
  articleId: number;
  imageUrl: string | null;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center gap-3">
      {imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="h-[54px] w-[72px] rounded-[4px] bg-ink-100 object-cover"
        />
      )}
      <ImageUploader
        onUploaded={async (imgs) => {
          if (imgs[0]) await setPressArticleImage(articleId, imgs[0]);
          router.refresh();
        }}
      />
    </div>
  );
}
