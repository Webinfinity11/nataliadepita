"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { blogPostInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";

async function takenSlugs(exceptId?: number) {
  const rows = await db
    .select({ slug: blogPosts.slug, id: blogPosts.id })
    .from(blogPosts);
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createBlogPost(formData: FormData) {
  await requireAdmin();
  const data = blogPostInput.parse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    status: formData.get("status") ?? "draft",
  });
  const slug = uniqueSlug(slugify(data.title), await takenSlugs());
  const [row] = await db
    .insert(blogPosts)
    .values({
      title: data.title,
      slug,
      body: sanitizeHtml(data.body),
      status: data.status,
      coverPhotoUrl: (formData.get("coverPhotoUrl") as string) || null,
      publishedAt: data.status === "published" ? new Date() : null,
    })
    .returning({ id: blogPosts.id });
  redirect(`/admin/blog/${row.id}`);
}

export async function updateBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = blogPostInput.parse({
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    status: formData.get("status") ?? "draft",
  });
  const [current] = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.id, id));
  const slug = uniqueSlug(slugify(data.title), await takenSlugs(id));
  await db
    .update(blogPosts)
    .set({
      title: data.title,
      slug,
      body: sanitizeHtml(data.body),
      status: data.status,
      coverPhotoUrl: (formData.get("coverPhotoUrl") as string) || null,
      publishedAt:
        data.status === "published"
          ? (current?.publishedAt ?? new Date())
          : null,
    })
    .where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  revalidatePath(`/blog/${slug}`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog");
  revalidatePath("/blog");
  redirect("/admin/blog");
}
