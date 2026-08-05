import Image from "next/image";
import { getPressArticles, getPressPhotos } from "@/lib/queries";

const Arrow = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-2 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function PressPage() {
  const [articles, photos] = await Promise.all([
    getPressArticles(),
    getPressPhotos(),
  ]);

  return (
    <main className="px-6 lg:px-12">
      <section className="mx-auto max-w-[1240px] pt-12 lg:pt-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Media
        </p>
        <h1 className="text-center font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
          Press
        </h1>
        <div className="mt-12 border-t border-ink-200" />
      </section>

      {articles.length > 0 && (
        <section className="mx-auto max-w-[820px] pt-14 lg:pt-20">
          <ul className="divide-y divide-ink-200 border-y border-ink-200">
            {articles.map((a) => (
              <li key={a.id}>
                <a
                  href={a.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start justify-between gap-6 py-6 transition-colors"
                >
                  <span>
                    {(a.publication || a.publishedOn) && (
                      <span className="block text-xs uppercase tracking-[0.22em] text-ink-500">
                        {[a.publication, a.publishedOn]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                    <span className="mt-2 block font-display text-2xl leading-tight tracking-tight text-ink-900 sm:text-3xl">
                      {a.title}
                    </span>
                  </span>
                  <Arrow />
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mx-auto max-w-[1240px] py-14 lg:py-20">
        {photos.length === 0 && articles.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl text-ink-400">
              Nothing here yet.
            </p>
            <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
          </div>
        ) : (
          <div className="columns-1 gap-8 sm:columns-2 lg:columns-3">
            {photos.map((p) => (
              <div
                key={p.id}
                className="mb-8 break-inside-avoid overflow-hidden bg-ink-100"
              >
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
