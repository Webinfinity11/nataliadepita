import Link from "next/link";
import { notFound } from "next/navigation";
import Image from "next/image";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { RichText } from "@/components/RichText";

const fmt = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d)
    : "";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [p] = await db
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl px-6 py-14 lg:py-20">
      <Link
        href="/blog"
        className="text-xs uppercase tracking-[0.24em] text-ink-500 transition-colors hover:text-ink-900"
      >
        ← News
      </Link>
      {p.publishedAt && (
        <p className="mt-8 text-xs uppercase tracking-[0.28em] text-ink-500">
          {fmt(p.publishedAt)}
        </p>
      )}
      <h1 className="mt-4 font-display text-4xl leading-[1.06] tracking-tight text-ink-900 sm:text-5xl">
        {p.title}
      </h1>
      {p.coverPhotoUrl && (
        <div className="my-10 aspect-[16/8] w-full overflow-hidden bg-ink-100">
          <Image
            src={p.coverPhotoUrl}
            alt=""
            width={1400}
            height={700}
            className="h-full w-full object-cover"
          />
        </div>
      )}
      <div className="mt-8">
        <RichText html={p.body} />
      </div>
    </article>
  );
}
