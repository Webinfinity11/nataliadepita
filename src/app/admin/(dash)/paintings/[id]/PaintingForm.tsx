"use client";
import { useRef } from "react";
import Image from "next/image";
import type { Painting, Photo, Category } from "@/db/schema";
import { ImageUploader } from "@/components/admin/ImageUploader";
import {
  updatePainting,
  deletePainting,
  addPhoto,
  removePhoto,
  setCoverPhoto,
} from "../actions";

export function PaintingForm({
  painting,
  categories,
  photos,
}: {
  painting: Painting;
  categories: Category[];
  photos: Photo[];
}) {
  const addRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const wRef = useRef<HTMLInputElement>(null);
  const hRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl">Edit painting</h1>
      <form action={updatePainting} className="space-y-3">
        <input type="hidden" name="id" value={painting.id} />
        <input
          name="title"
          defaultValue={painting.title}
          className="border p-2 w-full"
        />
        <select
          name="categoryId"
          defaultValue={painting.categoryId}
          className="border p-2 w-full"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <textarea
          name="description"
          defaultValue={painting.description ?? ""}
          className="border p-2 w-full"
          rows={4}
          placeholder="Description (optional)"
        />
        <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Photos</h2>
        <ImageUploader
          onUploaded={(img) => {
            urlRef.current!.value = img.url;
            wRef.current!.value = String(img.width);
            hRef.current!.value = String(img.height);
            addRef.current!.requestSubmit();
          }}
        />
        <form ref={addRef} action={addPhoto} className="hidden">
          <input type="hidden" name="paintingId" value={painting.id} />
          <input type="hidden" name="url" ref={urlRef} />
          <input type="hidden" name="width" ref={wRef} />
          <input type="hidden" name="height" ref={hRef} />
        </form>
        <div className="grid grid-cols-3 gap-4">
          {photos.map((ph) => (
            <div key={ph.id} className="border p-2 space-y-1">
              <Image
                src={ph.url}
                alt=""
                width={300}
                height={300}
                className="w-full h-40 object-cover"
              />
              {painting.coverPhotoUrl === ph.url ? (
                <span className="text-xs text-green-700">Cover</span>
              ) : (
                <form action={setCoverPhoto}>
                  <input type="hidden" name="paintingId" value={painting.id} />
                  <input type="hidden" name="url" value={ph.url} />
                  <button className="text-xs underline">Make cover</button>
                </form>
              )}
              <form action={removePhoto}>
                <input type="hidden" name="photoId" value={ph.id} />
                <input type="hidden" name="paintingId" value={painting.id} />
                <button className="text-xs text-red-600">Remove</button>
              </form>
            </div>
          ))}
        </div>
      </section>

      <form action={deletePainting}>
        <input type="hidden" name="id" value={painting.id} />
        <button className="text-sm text-red-600">Delete painting</button>
      </form>
    </div>
  );
}
