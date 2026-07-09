import { asc } from "drizzle-orm";
import { db } from "@/db";
import { galleryPhotos } from "@/db/schema";
import { moveGalleryPhoto, removeGalleryPhoto } from "./actions";
import { PhotogalleryUploader } from "./PhotogalleryUploader";

export default async function PhotogalleryAdminPage() {
  const photos = await db
    .select()
    .from(galleryPhotos)
    .orderBy(asc(galleryPhotos.position), asc(galleryPhotos.id));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Media</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Photogallery
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          These photos appear on the public Photogallery page, in this order.
        </p>
      </header>

      <PhotogalleryUploader />

      {photos.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
          No photos yet — upload some above.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
          {photos.map((p, i) => (
            <li
              key={p.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <span className="w-5 text-sm text-ink-400">{i + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                loading="lazy"
                decoding="async"
                className="h-[54px] w-[72px] rounded-[4px] bg-ink-100 object-cover"
              />
              <span className="flex-1 truncate text-xs text-ink-400">
                {p.width && p.height ? `${p.width}×${p.height}` : ""}
              </span>
              <form action={moveGalleryPhoto}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="dir" value="up" />
                <button className="px-2 text-ink-500 hover:text-ink-900" title="Move up">
                  ↑
                </button>
              </form>
              <form action={moveGalleryPhoto}>
                <input type="hidden" name="id" value={p.id} />
                <input type="hidden" name="dir" value="down" />
                <button className="px-2 text-ink-500 hover:text-ink-900" title="Move down">
                  ↓
                </button>
              </form>
              <form action={removeGalleryPhoto}>
                <input type="hidden" name="id" value={p.id} />
                <button className="text-sm text-danger-600 hover:text-danger-700">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
