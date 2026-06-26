"use client";
import { useState } from "react";
import Image from "next/image";
import type { BlogPost } from "@/db/schema";
import { Editor } from "@/components/admin/Editor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { updateBlogPost, deleteBlogPost } from "../actions";

export function BlogForm({ post }: { post: BlogPost }) {
  const [body, setBody] = useState(post.body);
  const [cover, setCover] = useState(post.coverPhotoUrl ?? "");
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl">Edit post</h1>
      <form action={updateBlogPost} className="space-y-4">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="coverPhotoUrl" value={cover} />
        <input
          name="title"
          defaultValue={post.title}
          className="border p-2 w-full text-xl"
        />
        <div className="space-y-2">
          <span className="text-sm">Cover</span>
          {cover && (
            <Image
              src={cover}
              alt=""
              width={240}
              height={140}
              className="object-cover"
            />
          )}
          <ImageUploader onUploaded={(imgs) => imgs[0] && setCover(imgs[0].url)} />
        </div>
        <Editor value={post.body} onChange={setBody} />
        <div className="flex items-center gap-3">
          <select
            name="status"
            defaultValue={post.status}
            className="border p-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
        </div>
      </form>
      <form action={deleteBlogPost}>
        <input type="hidden" name="id" value={post.id} />
        <button className="text-sm text-red-600">Delete</button>
      </form>
    </div>
  );
}
