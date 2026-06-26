import { asc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { featured, paintings } from "@/db/schema";
import { removeFeatured, moveFeatured, setFeaturedTitle } from "./actions";
import { FeaturedUploader } from "./FeaturedUploader";

export default async function FeaturedPage() {
  const feat = await db.select().from(featured).orderBy(asc(featured.position));

  // Legacy rows may still rely on a linked painting for their image.
  const legacyIds = feat
    .filter((f) => !f.imageUrl && f.paintingId != null)
    .map((f) => f.paintingId as number);
  const byId = new Map<number, { coverPhotoUrl: string | null; title: string }>();
  if (legacyIds.length) {
    const rows = await db
      .select()
      .from(paintings)
      .where(inArray(paintings.id, legacyIds));
    rows.forEach((p) =>
      byId.set(p.id, { coverPhotoUrl: p.coverPhotoUrl, title: p.title }),
    );
  }

  const slides = feat.map((f) => {
    const legacy = f.paintingId != null ? byId.get(f.paintingId) : undefined;
    return {
      id: f.id,
      url: f.imageUrl ?? legacy?.coverPhotoUrl ?? null,
      title: f.title ?? legacy?.title ?? "",
    };
  });

  return (
    <div className="space-y-10">
      <header>
        <p className="text-xs uppercase tracking-[0.28em] text-ink-400">Homepage</p>
        <h1 className="mt-2 font-display text-4xl tracking-tight text-ink-900">
          Home slider
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          These images appear in the homepage slider, in this order.
        </p>
      </header>

      <FeaturedUploader />

      {slides.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
          No slides yet — upload some above.
        </p>
      ) : (
        <ol className="overflow-hidden rounded-[8px] border border-ink-200 bg-white">
          {slides.map((s, i) => (
            <li
              key={s.id}
              className={`flex items-center gap-4 px-4 py-3 ${
                i > 0 ? "border-t border-ink-100" : ""
              }`}
            >
              <span className="w-5 text-sm text-ink-400">{i + 1}</span>
              {s.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.url}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-[54px] w-[72px] rounded-[4px] bg-ink-100 object-cover"
                />
              ) : (
                <div className="h-[54px] w-[72px] rounded-[4px] bg-ink-100" />
              )}
              <form action={setFeaturedTitle} className="flex flex-1 items-center gap-2">
                <input type="hidden" name="id" value={s.id} />
                <input
                  name="title"
                  defaultValue={s.title}
                  placeholder="Slide title (optional)"
                  className="min-w-0 flex-1"
                />
                <button
                  className="shrink-0 rounded-[6px] border border-ink-300 px-3 py-1.5 text-sm text-ink-700 hover:border-ink-900 hover:text-ink-900"
                  title="Save title"
                >
                  Save
                </button>
              </form>
              <form action={moveFeatured}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="up" />
                <button className="px-2 text-ink-500 hover:text-ink-900" title="Move up">
                  ↑
                </button>
              </form>
              <form action={moveFeatured}>
                <input type="hidden" name="id" value={s.id} />
                <input type="hidden" name="dir" value="down" />
                <button className="px-2 text-ink-500 hover:text-ink-900" title="Move down">
                  ↓
                </button>
              </form>
              <form action={removeFeatured}>
                <input type="hidden" name="id" value={s.id} />
                <button className="text-sm text-danger-600 hover:text-danger-700">
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
