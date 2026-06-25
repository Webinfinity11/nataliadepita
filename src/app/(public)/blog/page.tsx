import Link from "next/link";
import Image from "next/image";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";

const fmt = (d: Date | null) =>
  d
    ? new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }).format(d)
    : "";

export default async function BlogList() {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.status, "published"))
    .orderBy(desc(blogPosts.publishedAt));

  const [featured, ...rest] = rows;

  return (
    <main className="px-6 lg:px-12">
      {/* title */}
      <section className="mx-auto max-w-[1180px] pt-14 lg:pt-20">
        <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Journal</p>
        <h1 className="mt-5 font-display text-5xl tracking-tight text-ink-900 sm:text-6xl">
          News
        </h1>
        <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
          Notes from the studio — paintings, mosaics, and the slow work in between.
        </p>
        <div className="mt-12 border-t border-ink-200" />
      </section>

      {rows.length === 0 ? (
        <section className="mx-auto max-w-[1180px] py-40 text-center">
          <p className="font-display text-3xl text-ink-400">No posts yet.</p>
          <p className="mt-2 text-sm text-ink-500">New writing will appear here.</p>
        </section>
      ) : (
        <>
          {/* feature */}
          <section className="mx-auto max-w-[1180px] py-16 lg:py-20">
            <Link href={`/blog/${featured.slug}`} className="group block">
              {featured.coverPhotoUrl && (
                <div className="aspect-[16/8] w-full overflow-hidden bg-ink-100">
                  <Image
                    src={featured.coverPhotoUrl}
                    alt=""
                    width={1400}
                    height={700}
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.03]"
                  />
                </div>
              )}
              <div className="mt-7 max-w-3xl">
                <p className="text-xs uppercase tracking-[0.28em] text-ink-500">
                  Latest · {fmt(featured.publishedAt)}
                </p>
                <h2 className="mt-4 font-display text-4xl leading-[1.05] tracking-tight text-ink-900 transition-colors group-hover:text-ink-700 sm:text-5xl">
                  {featured.title}
                </h2>
                <span className="mt-6 inline-block text-sm text-ink-600 underline decoration-ink-300 underline-offset-4 transition-colors group-hover:decoration-ink-900">
                  Read the post
                </span>
              </div>
            </Link>
          </section>

          {/* list */}
          {rest.length > 0 && (
            <section className="mx-auto max-w-3xl border-t border-ink-200 pb-24 pt-4">
              {rest.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${p.slug}`}
                  className="group block w-full border-b border-ink-100 py-12"
                >
                  <p className="text-xs uppercase tracking-[0.28em] text-ink-500">
                    {fmt(p.publishedAt)}
                  </p>
                  {p.coverPhotoUrl ? (
                    <div className="mt-5 grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                      <div className="aspect-[16/9] w-full overflow-hidden bg-ink-100">
                        <Image
                          src={p.coverPhotoUrl}
                          alt=""
                          width={400}
                          height={225}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        />
                      </div>
                      <h2 className="font-display text-2xl leading-tight tracking-tight text-ink-900 underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-ink-900">
                        {p.title}
                      </h2>
                    </div>
                  ) : (
                    <h2 className="mt-4 max-w-2xl font-display text-2xl leading-tight tracking-tight text-ink-900 underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-ink-900">
                      {p.title}
                    </h2>
                  )}
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}
