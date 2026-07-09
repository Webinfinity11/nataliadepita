import Image from "next/image";
import { getGalleryPhotos } from "@/lib/queries";

export default async function PhotogalleryPage() {
  const photos = await getGalleryPhotos();

  return (
    <main className="px-6 lg:px-12">
      <section className="mx-auto max-w-[1240px] pt-12 lg:pt-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Media
        </p>
        <h1 className="text-center font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
          Photogallery
        </h1>
        <div className="mt-12 border-t border-ink-200" />
      </section>

      <section className="mx-auto max-w-[1240px] py-14 lg:py-20">
        {photos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl text-ink-400">
              No photos yet.
            </p>
            <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
          </div>
        ) : (
          <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
            {photos.map((p) => (
              <div key={p.id} className="mb-8 break-inside-avoid overflow-hidden bg-ink-100">
                <Image
                  src={p.url}
                  alt=""
                  width={p.width ?? 900}
                  height={p.height ?? 1200}
                  sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 90vw"
                  className="h-auto w-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
