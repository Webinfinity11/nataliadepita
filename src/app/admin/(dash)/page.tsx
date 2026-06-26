import Link from "next/link";
import { sql, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  paintings,
  categories,
  featured,
  blogPosts,
  contactMessages,
} from "@/db/schema";

const N = sql<number>`count(*)::int`;

export default async function Dashboard() {
  const [
    [{ n: nPaintings }],
    [{ n: nCategories }],
    [{ n: nFeatured }],
    [{ n: nBlog }],
    [{ n: nUnread }],
  ] = await Promise.all([
    db.select({ n: N }).from(paintings),
    db.select({ n: N }).from(categories),
    db.select({ n: N }).from(featured),
    db.select({ n: N }).from(blogPosts),
    db.select({ n: N }).from(contactMessages).where(eq(contactMessages.read, false)),
  ]);

  const stats: { label: string; value: number; href: string }[] = [
    { label: "Paintings", value: nPaintings, href: "/admin/paintings" },
    { label: "Categories", value: nCategories, href: "/admin/categories" },
    { label: "Featured", value: nFeatured, href: "/admin/featured" },
    { label: "Blog posts", value: nBlog, href: "/admin/blog" },
    { label: "Unread messages", value: nUnread, href: "/admin/messages" },
  ];

  const actions: { label: string; href: string; desc: string }[] = [
    { label: "Add a painting", href: "/admin/paintings", desc: "Upload new work and photos" },
    { label: "Edit categories", href: "/admin/categories", desc: "Collections shown in the portfolio" },
    { label: "Homepage slides", href: "/admin/featured", desc: "Choose the featured slider images" },
    { label: "Write a post", href: "/admin/blog", desc: "Publish news and announcements" },
    { label: "Site settings", href: "/admin/settings", desc: "About text, contact, social links" },
  ];

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Overview</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Dashboard
        </h1>
      </header>

      {/* stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group rounded-[8px] border border-ink-200 bg-white p-5 transition-colors hover:border-ink-900"
          >
            <p className="font-display text-4xl text-ink-900">{s.value}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-500 group-hover:text-ink-900">
              {s.label}
            </p>
          </Link>
        ))}
      </div>

      {/* quick actions */}
      <section>
        <h2 className="text-xs uppercase tracking-[0.28em] text-ink-400">
          Quick actions
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.label}
              href={a.href}
              className="group flex items-start justify-between gap-4 rounded-[8px] border border-ink-200 bg-white p-5 transition-colors hover:border-ink-900"
            >
              <span>
                <span className="block font-display text-lg text-ink-900">
                  {a.label}
                </span>
                <span className="mt-1 block text-sm text-ink-500">{a.desc}</span>
              </span>
              <span className="mt-1 text-ink-300 transition-colors group-hover:text-ink-900">
                ↗
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
