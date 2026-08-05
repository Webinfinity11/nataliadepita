import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos, paintingVideos } from "@/db/schema";
import { Lightbox } from "@/components/Lightbox";
import { VideoEmbed, VideoFile } from "@/components/VideoEmbed";
import { parseVideo, isPortraitVideo } from "@/lib/video";

export default async function PaintingPage({
  params,
}: {
  params: Promise<{ category: string; painting: string }>;
}) {
  const { category, painting } = await params;
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, category));
  if (!cat) notFound();
  const [p] = await db
    .select()
    .from(paintings)
    .where(
      and(eq(paintings.categoryId, cat.id), eq(paintings.slug, painting)),
    );
  if (!p) notFound();
  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.paintingId, p.id))
    .orderBy(asc(photos.position));
  // ensure the cover is first
  pics.sort((a, b) =>
    a.url === p.coverPhotoUrl ? -1 : b.url === p.coverPhotoUrl ? 1 : 0,
  );
  const clips = await db
    .select()
    .from(paintingVideos)
    .where(eq(paintingVideos.paintingId, p.id))
    .orderBy(asc(paintingVideos.position));
  // A link resolves to a provider embed; anything else is a file we host.
  const videos = clips.map((v) => ({ ...v, embed: parseVideo(v.url) }));
  return (
    <article className="mx-auto max-w-4xl px-6 py-14 lg:py-20">
      <Link
        href={`/${cat.slug}`}
        className="text-xs uppercase tracking-[0.24em] text-ink-500 transition-colors hover:text-ink-900"
      >
        ← {cat.name}
      </Link>
      <div className="mt-8">
        <Lightbox photos={pics} />
      </div>
      <h1 className="mt-10 font-display text-4xl leading-tight tracking-tight text-ink-900 sm:text-5xl">
        {p.title}
      </h1>
      <p className="mt-2 text-xs uppercase tracking-[0.22em] text-ink-500">
        {cat.name}
      </p>
      {p.description && (
        <p className="mt-6 max-w-2xl whitespace-pre-wrap text-lg leading-relaxed text-ink-700">
          {p.description}
        </p>
      )}
      {videos.length > 0 && (
        <section className="mt-14 space-y-12">
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
              {/* Facebook refuses to embed some videos (rights, privacy) —
                  always offer the original as a way through. */}
              {v.embed?.provider === "facebook" && (
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
        </section>
      )}
    </article>
  );
}
