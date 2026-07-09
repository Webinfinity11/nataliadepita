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
        <section className="mx-auto max-w-3xl pb-24">
          {rows.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group block w-full border-b border-ink-100 py-12"
            >
              <p className="text-xs uppercase tracking-[0.28em] text-ink-500">
                {fmt(p.publishedAt)}
              </p>
              <div className="mt-5 grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] sm:items-center">
                <div className="aspect-[16/9] w-full overflow-hidden bg-ink-100">
                  {p.coverPhotoUrl ? (
                    <Image
                      src={p.coverPhotoUrl}
                      alt=""
                      width={400}
                      height={225}
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span
                        aria-hidden
                        className="font-display text-3xl text-ink-300 transition-colors group-hover:text-ink-400"
                      >
                        N
                      </span>
                    </div>
                  )}
                </div>
                <h2 className="font-display text-2xl leading-tight tracking-tight text-ink-900 underline decoration-transparent decoration-1 underline-offset-4 transition-colors group-hover:decoration-ink-900">
                  {p.title}
                </h2>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
