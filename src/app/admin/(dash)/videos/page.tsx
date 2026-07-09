import { asc } from "drizzle-orm";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { parseVideo } from "@/lib/video";
import { moveVideo, removeVideo } from "./actions";
import { VideoForm } from "./VideoForm";

export default async function VideosAdminPage() {
  const rows = await db
    .select()
    .from(videos)
    .orderBy(asc(videos.position), asc(videos.id));

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Media</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Videos
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Paste a YouTube or Vimeo link. Videos appear on the public Videos page,
          in this order.
        </p>
      </header>

      <VideoForm />

      {rows.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
          No videos yet — add one above.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
          {rows.map((v, i) => {
            const embed = parseVideo(v.url);
            return (
              <li
                key={v.id}
                className={`flex items-center gap-4 px-4 py-3 ${
                  i > 0 ? "border-t border-ink-100" : ""
                }`}
              >
                <span className="w-5 text-sm text-ink-400">{i + 1}</span>
                <span className="shrink-0 rounded-[4px] bg-ink-100 px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-ink-500">
                  {embed?.provider ?? "?"}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-ink-800">
                    {v.title || "Untitled"}
                  </p>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-xs text-ink-400 underline decoration-ink-200 underline-offset-2 hover:text-ink-700"
                  >
                    {v.url}
                  </a>
                </div>
                <form action={moveVideo}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button className="px-2 text-ink-500 hover:text-ink-900" title="Move up">
                    ↑
                  </button>
                </form>
                <form action={moveVideo}>
                  <input type="hidden" name="id" value={v.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button className="px-2 text-ink-500 hover:text-ink-900" title="Move down">
                    ↓
                  </button>
                </form>
                <form action={removeVideo}>
                  <input type="hidden" name="id" value={v.id} />
                  <button className="text-sm text-danger-600 hover:text-danger-700">
                    Remove
                  </button>
                </form>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
