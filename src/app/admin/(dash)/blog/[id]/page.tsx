import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { BlogForm } from "./BlogForm";

export default async function EditBlog({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [post] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, Number(id)));
  if (!post) notFound();
  return <BlogForm post={post} />;
}
