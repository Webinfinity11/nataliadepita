import { getVideos } from "@/lib/queries";
import { parseVideo } from "@/lib/video";

export default async function VideosPage() {
  const rows = await getVideos();

  // Some reels have been added to the admin more than once — show each only
  // where it first appears instead of repeating it further down the page.
  const seen = new Set<string>();
  const videos = rows.flatMap((v) => {
    const embed = parseVideo(v.url);
    if (!embed || seen.has(embed.embedUrl)) return [];
    seen.add(embed.embedUrl);
    return [{ ...v, embed }];
  });

  return (
    <main className="px-6 lg:px-12">
      <section className="mx-auto max-w-[1240px] pt-12 lg:pt-16">
        <p className="mb-6 text-center text-xs uppercase tracking-[0.3em] text-ink-500">
          Media
        </p>
        <h1 className="text-center font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
          Videos
        </h1>
        <div className="mt-12 border-t border-ink-200" />
      </section>

      <section className="mx-auto max-w-[1240px] py-14 lg:py-20">
        {videos.length === 0 ? (
          <div className="py-24 text-center">
            <p className="font-display text-3xl text-ink-400">No videos yet.</p>
            <p className="mt-2 text-sm text-ink-500">Please check back soon.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-10 gap-y-14 lg:grid-cols-2">
            {videos.map((v) => (
              <figure key={v.id}>
                <div
                  className={`w-full overflow-hidden bg-ink-100 ${
                    v.embed.orientation === "portrait"
                      ? "mx-auto aspect-[9/16] max-w-[360px]"
                      : "aspect-video"
                  }`}
                >
                  <iframe
                    src={v.embed.embedUrl}
                    title={v.title ?? "Video"}
                    loading="lazy"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    className="h-full w-full border-0"
                  />
                </div>
                {v.title && (
                  <figcaption className="mt-4 font-display text-2xl leading-tight tracking-tight text-ink-900">
                    {v.title}
                  </figcaption>
                )}
                {/* Facebook refuses to embed some videos (rights, privacy) —
                    always offer the original as a way through. */}
                {v.embed.provider === "facebook" && (
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-block text-xs uppercase tracking-[0.18em] text-ink-500 underline decoration-ink-200 underline-offset-4 transition-colors hover:text-ink-900"
                  >
                    Watch on Facebook
                  </a>
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
