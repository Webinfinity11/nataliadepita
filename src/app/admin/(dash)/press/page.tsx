import { asc } from "drizzle-orm";
import { db } from "@/db";
import { pressArticles, pressPhotos } from "@/db/schema";
import {
  addPressArticle,
  movePressArticle,
  removePressArticle,
  movePressPhoto,
  removePressPhoto,
} from "./actions";
import { PressUploader } from "./PressUploader";

export default async function PressAdminPage() {
  const articles = await db
    .select()
    .from(pressArticles)
    .orderBy(asc(pressArticles.position), asc(pressArticles.id));
  const photos = await db
    .select()
    .from(pressPhotos)
    .orderBy(asc(pressPhotos.position), asc(pressPhotos.id));

  return (
    <div className="space-y-12">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Media</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Press
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Articles appear first on the public Press page, the gallery below them.
        </p>
      </header>

      {/* articles */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight text-ink-900">
          Articles{" "}
          <span className="text-base font-normal text-ink-400">
            ({articles.length})
          </span>
        </h2>

        <form
          action={addPressArticle}
          className="flex max-w-3xl flex-wrap items-center gap-3 rounded-[8px] border border-ink-200 bg-white p-4"
        >
          <input
            name="title"
            placeholder="Headline"
            required
            className="min-w-[220px] flex-1"
          />
          <input
            name="url"
            type="url"
            placeholder="https://…"
            required
            className="min-w-[220px] flex-1"
          />
          <input
            name="publication"
            placeholder="Publication (optional)"
            className="min-w-[150px]"
          />
          <input
            name="publishedOn"
            placeholder="Date (optional)"
            className="min-w-[120px]"
          />
          <button className="bg-ink-900 px-4 py-2 text-sm font-medium text-ink-50">
            Add
          </button>
        </form>

        {articles.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
            No articles yet — add one above.
          </p>
        ) : (
          <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
            {articles.map((a, i) => (
              <li
                key={a.id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 ${
                  i > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <span className="w-5 text-sm text-ink-400">{i + 1}</span>
                <div className="min-w-[200px] flex-1">
                  <p className="text-sm text-ink-900">{a.title}</p>
                  <p className="truncate text-xs text-ink-400">
                    {[a.publication, a.publishedOn].filter(Boolean).join(" · ")}
                    {a.publication || a.publishedOn ? " — " : ""}
                    {a.url}
                  </p>
                </div>
                <form action={movePressArticle}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    className="px-2 text-ink-500 hover:text-ink-900"
                    title="Move up"
                  >
                    ↑
                  </button>
                </form>
                <form action={movePressArticle}>
                  <input type="hidden" name="id" value={a.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    className="px-2 text-ink-500 hover:text-ink-900"
                    title="Move down"
                  >
                    ↓
                  </button>
                </form>
                <form action={removePressArticle}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-sm text-danger-600 hover:text-danger-700">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>

      {/* gallery */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl tracking-tight text-ink-900">
          Gallery{" "}
          <span className="text-base font-normal text-ink-400">
            ({photos.length})
          </span>
        </h2>

        <PressUploader />

        {photos.length === 0 ? (
          <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
            No photos yet — upload some above.
          </p>
        ) : (
          <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
            {photos.map((p, i) => (
              <li
                key={p.id}
                className={`flex items-center gap-4 px-4 py-3 ${
                  i > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <span className="w-5 text-sm text-ink-400">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-[54px] w-[72px] rounded-[4px] bg-ink-100 object-cover"
                />
                <span className="flex-1 truncate text-xs text-ink-400">
                  {p.width && p.height ? `${p.width}×${p.height}` : ""}
                </span>
                <form action={movePressPhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button
                    className="px-2 text-ink-500 hover:text-ink-900"
                    title="Move up"
                  >
                    ↑
                  </button>
                </form>
                <form action={movePressPhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button
                    className="px-2 text-ink-500 hover:text-ink-900"
                    title="Move down"
                  >
                    ↓
                  </button>
                </form>
                <form action={removePressPhoto}>
                  <input type="hidden" name="id" value={p.id} />
                  <button className="text-sm text-danger-600 hover:text-danger-700">
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
