"use client";
import { useActionState, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type {
  Painting,
  Photo,
  Category,
  PaintingVideo,
} from "@/db/schema";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { VideoEmbed, VideoFile } from "@/components/VideoEmbed";
import { parseVideo, isPortraitVideo } from "@/lib/video";
import {
  updatePainting,
  deletePainting,
  addPhotos,
  reorderPhotos,
  removePhoto,
  setCoverPhoto,
  addPaintingVideo,
  addUploadedPaintingVideo,
  reorderPaintingVideos,
  removePaintingVideo,
} from "../actions";
import { uploadVideoWithPoster } from "@/lib/video-upload";

export function PaintingForm({
  painting,
  categories,
  photos,
  videos,
}: {
  painting: Painting;
  categories: Category[];
  photos: Photo[];
  videos: PaintingVideo[];
}) {
  const router = useRouter();
  const [list, setList] = useState<Photo[]>(photos);
  const [saving, setSaving] = useState(false);
  const [saveState, saveDetails] = useActionState(updatePainting, null);

  // Resync local order only when the SET of photos changes (add / remove),
  // so an optimistic reorder isn't clobbered by the post-save re-render.
  const sig = photos
    .map((p) => p.id)
    .slice()
    .sort((a, b) => a - b)
    .join(",");
  useEffect(() => {
    setList(photos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);

  async function persistOrder(next: Photo[]) {
    setList(next);
    setSaving(true);
    await reorderPhotos(
      painting.id,
      next.map((p) => p.id),
    );
    setSaving(false);
    router.refresh();
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    persistOrder(next);
  }

  async function handleUploaded(
    imgs: { url: string; width: number; height: number }[],
  ) {
    await addPhotos(painting.id, imgs);
    router.refresh();
  }

  async function makeCover(url: string) {
    const fd = new FormData();
    fd.set("paintingId", String(painting.id));
    fd.set("url", url);
    await setCoverPhoto(fd);
    router.refresh();
  }

  async function remove(photoId: number) {
    const fd = new FormData();
    fd.set("photoId", String(photoId));
    fd.set("paintingId", String(painting.id));
    await removePhoto(fd);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-ink-400">
            Edit painting
          </p>
          <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
            {painting.title}
          </h1>
        </div>
        <a
          href="/admin/paintings"
          className="text-sm text-ink-500 transition-colors hover:text-ink-900"
        >
          ← Back
        </a>
      </header>

      {/* details */}
      <form
        action={saveDetails}
        className="max-w-xl space-y-3 rounded-[8px] border border-ink-200 bg-white p-5"
      >
        <input type="hidden" name="id" value={painting.id} />
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-500">
            Title
          </span>
          <input name="title" defaultValue={painting.title} className="w-full" />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-500">
            Category
          </span>
          <select
            name="categoryId"
            defaultValue={painting.categoryId}
            className="w-full"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs uppercase tracking-[0.14em] text-ink-500">
            Description
          </span>
          <textarea
            name="description"
            defaultValue={painting.description ?? ""}
            rows={14}
            className="w-full resize-y font-sans leading-relaxed"
            placeholder="Optional — as long as you like"
          />
        </label>
        <div className="flex items-center gap-3">
          <SaveButton />
          {saveState?.ok && (
            <span className="text-sm text-ink-500">Saved ✓</span>
          )}
        </div>
        {saveState && !saveState.ok && (
          <p className="rounded-[6px] border border-danger-600/30 bg-danger-50 px-3 py-2 text-sm text-danger-700">
            Not saved — {saveState.error}
          </p>
        )}
      </form>

      {/* photos */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl tracking-tight text-ink-900">
              Photos{" "}
              <span className="text-base font-normal text-ink-400">
                ({list.length})
              </span>
            </h2>
            <p className="mt-1 max-w-md text-sm text-ink-500">
              The number shows the order. Use{" "}
              <span className="font-medium text-ink-700">←</span> /{" "}
              <span className="font-medium text-ink-700">→</span> to move a photo,{" "}
              <span className="font-medium text-ink-700">★</span> to set the cover.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saving && <span className="text-xs text-ink-400">Saving…</span>}
            <ImageUploader multiple onUploaded={handleUploaded} />
          </div>
        </div>

        {list.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
            No photos yet — upload some above.
          </p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {list.map((ph, i) => {
              const isCover = painting.coverPhotoUrl === ph.url;
              return (
                <li
                  key={ph.id}
                  className="overflow-hidden rounded-[8px] border border-ink-200 bg-white"
                >
                  <div className="relative">
                    <span className="absolute left-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-ink-900/75 text-xs font-medium text-ink-50">
                      {i + 1}
                    </span>
                    {isCover && (
                      <span className="absolute right-2 top-2 z-10 rounded-full bg-ink-50/90 px-2 py-0.5 text-[11px] font-medium text-ink-900">
                        ★ Cover
                      </span>
                    )}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={ph.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full bg-ink-100 object-cover"
                    />
                  </div>

                  {/* toolbar */}
                  <div className="flex items-center justify-between gap-1 px-2 py-2">
                    <div className="flex items-center gap-1">
                      <IconBtn
                        title="Move earlier"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        ←
                      </IconBtn>
                      <IconBtn
                        title="Move later"
                        disabled={i === list.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        →
                      </IconBtn>
                      <IconBtn
                        title={isCover ? "This is the cover" : "Set as cover"}
                        active={isCover}
                        onClick={() => !isCover && makeCover(ph.url)}
                      >
                        ★
                      </IconBtn>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(ph.id)}
                      title="Remove photo"
                      className="rounded-[5px] px-2 py-1 text-xs text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-700"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* videos */}
      <VideoSection paintingId={painting.id} videos={videos} />

      {/* danger */}
      <form action={deletePainting} className="border-t border-ink-200 pt-6">
        <input type="hidden" name="id" value={painting.id} />
        <button className="text-sm text-danger-600 hover:text-danger-700">
          Delete painting
        </button>
      </form>
    </div>
  );
}

const PROVIDER_LABEL = {
  youtube: "YouTube",
  vimeo: "Vimeo",
  facebook: "Facebook",
} as const;

function VideoSection({
  paintingId,
  videos,
}: {
  paintingId: number;
  videos: PaintingVideo[];
}) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadPct, setUploadPct] = useState<number | null>(null);

  // Recognise the provider as the link is pasted, so the editor sees it took
  // before pressing Add — there is no provider to choose by hand.
  const detected = url.trim() ? parseVideo(url) : null;

  async function uploadFile(file: File) {
    setErr(null);
    setBusy(true);
    setUploadPct(0);
    try {
      const uploaded = await uploadVideoWithPoster(file, setUploadPct);
      await addUploadedPaintingVideo(paintingId, uploaded, title);
      setTitle("");
      router.refresh();
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not upload the video file.",
      );
    } finally {
      setBusy(false);
      setUploadPct(null);
    }
  }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!detected) {
      setErr("Enter a valid YouTube, Vimeo or Facebook link.");
      return;
    }
    setBusy(true);
    try {
      await addPaintingVideo(paintingId, url, title);
      setUrl("");
      setTitle("");
      router.refresh();
    } catch {
      setErr("Could not add the video. Check the link and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= videos.length) return;
    const next = [...videos];
    [next[i], next[j]] = [next[j], next[i]];
    await reorderPaintingVideos(
      paintingId,
      next.map((v) => v.id),
    );
    router.refresh();
  }

  async function remove(id: number) {
    await removePaintingVideo(id, paintingId);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-display text-2xl tracking-tight text-ink-900">
          Videos{" "}
          <span className="text-base font-normal text-ink-400">
            ({videos.length})
          </span>
        </h2>
        <p className="mt-1 max-w-md text-sm text-ink-500">
          Paste a YouTube, Vimeo or Facebook link — the type is recognised
          automatically — or upload a video file. An uploaded video&apos;s first
          frame becomes the work&apos;s card image when it has no photos.
        </p>
      </div>

      <form
        onSubmit={add}
        className="flex max-w-xl flex-wrap items-start gap-3 rounded-[8px] border border-ink-200 bg-white p-4"
      >
        <div className="min-w-[220px] flex-1">
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a video link"
            className="w-full"
            required
          />
          {detected && (
            <p className="mt-1.5 text-xs text-ink-500">
              Recognised as{" "}
              <span className="font-medium text-ink-900">
                {PROVIDER_LABEL[detected.provider]}
              </span>
            </p>
          )}
          {err && <p className="mt-1.5 text-xs text-danger-600">{err}</p>}
        </div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Caption (optional)"
          className="min-w-[160px] flex-1"
        />
        <button
          disabled={busy}
          className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 disabled:opacity-60"
        >
          {busy ? "Adding…" : "Add"}
        </button>

        <div className="flex w-full items-center gap-3 border-t border-ink-100 pt-3">
          <label
            className={`inline-flex cursor-pointer items-center gap-2 rounded-[6px] border border-dashed border-ink-300 bg-white px-4 py-2.5 text-sm text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 ${
              busy ? "pointer-events-none opacity-60" : ""
            }`}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            {uploadPct === null
              ? "Upload a video file"
              : `Uploading ${Math.round(uploadPct)}%…`}
            <input
              type="file"
              accept="video/*"
              disabled={busy}
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) uploadFile(file);
              }}
            />
          </label>
          <span className="text-xs text-ink-400">MP4 or WebM, up to 500 MB.</span>
        </div>
      </form>

      {videos.length > 0 && (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v, i) => {
            const embed = parseVideo(v.url);
            return (
              <li
                key={v.id}
                className="overflow-hidden rounded-[8px] border border-ink-200 bg-white"
              >
                {embed ? (
                  <VideoEmbed embed={embed} title={v.title} />
                ) : (
                  <VideoFile
                    url={v.url}
                    poster={v.posterUrl}
                    title={v.title}
                    portrait={isPortraitVideo(v)}
                  />
                )}
                <div className="space-y-2 px-3 py-2">
                  <p className="truncate text-sm text-ink-700">
                    {v.title ||
                      (embed ? PROVIDER_LABEL[embed.provider] : "Uploaded file")}
                  </p>
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1">
                      <IconBtn
                        title="Move earlier"
                        disabled={i === 0}
                        onClick={() => move(i, -1)}
                      >
                        ←
                      </IconBtn>
                      <IconBtn
                        title="Move later"
                        disabled={i === videos.length - 1}
                        onClick={() => move(i, 1)}
                      >
                        →
                      </IconBtn>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(v.id)}
                      className="rounded-[5px] px-2 py-1 text-xs text-danger-600 transition-colors hover:bg-danger-50 hover:text-danger-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      disabled={pending}
      className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50 disabled:opacity-50"
    >
      {pending ? "Saving…" : "Save"}
    </button>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
  active,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`grid h-7 w-7 place-items-center rounded-[5px] border text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-30 ${
        active
          ? "border-ink-900 bg-ink-900 text-ink-50"
          : "border-ink-200 text-ink-700 hover:border-ink-900 hover:text-ink-900"
      }`}
    >
      {children}
    </button>
  );
}
