import { getVideos } from "@/lib/queries";
import { parseVideo, isPortraitVideo } from "@/lib/video";
import { VideoEmbed, VideoFile } from "@/components/VideoEmbed";
import { WatchOnFacebook } from "@/components/WatchOnFacebook";

export default async function VideosPage() {
  const rows = await getVideos();
  // A link resolves to a provider embed; anything else is a file we host.
  const videos = rows.map((v) => ({ ...v, embed: parseVideo(v.url) }));

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
                {v.embed ? (
                  <VideoEmbed embed={v.embed} title={v.title} />
                ) : (
                  <VideoFile
                    url={v.url}
                    poster={v.posterUrl}
                    title={v.title}
                    portrait={isPortraitVideo(v)}
                  />
                )}
                {v.title && (
                  <figcaption className="mt-4 font-display text-2xl leading-tight tracking-tight text-ink-900">
                    {v.title}
                  </figcaption>
                )}
                {/* Facebook refuses to embed some videos (rights, privacy) and
                    leaves an empty frame behind, which reads as a broken site
                    rather than a locked video. A button says plainly that there
                    is somewhere else to watch it. */}
                {v.embed?.provider === "facebook" && (
                  <WatchOnFacebook url={v.url} />
                )}
              </figure>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
