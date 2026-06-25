import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { createBlogPost } from "./actions";

export default async function BlogAdmin() {
  const rows = await db
    .select()
    .from(blogPosts)
    .orderBy(desc(blogPosts.createdAt));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Blog</h1>
      <form action={createBlogPost} className="flex gap-2">
        <input
          name="title"
          placeholder="New post title"
          required
          className="border p-2 flex-1"
        />
        <button className="bg-neutral-900 text-white px-4">Create</button>
      </form>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id} className="flex gap-3 border-b pb-2">
            <Link href={`/admin/blog/${p.id}`} className="underline flex-1">
              {p.title}
            </Link>
            <span className="text-sm text-neutral-500">{p.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
