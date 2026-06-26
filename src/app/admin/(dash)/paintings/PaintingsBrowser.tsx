"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { reorderPaintings } from "./actions";

type Row = {
  id: number;
  title: string;
  coverPhotoUrl: string | null;
  categoryName: string;
};

export function PaintingsBrowser({
  rows,
  categories,
}: {
  rows: Row[];
  categories: string[];
}) {
  const router = useRouter();
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState<Row[]>(rows);
  const [saving, setSaving] = useState(false);

  // Recompute the visible (ordered) subset whenever the filter or data changes.
  const sig = rows.map((r) => r.id).join(",");
  useEffect(() => {
    setItems(filter === "All" ? rows : rows.filter((r) => r.categoryName === filter));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, sig]);

  const canReorder = filter !== "All";

  async function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
    setSaving(true);
    await reorderPaintings(next.map((p) => p.id));
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {/* category dropdown */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="text-xs uppercase tracking-[0.14em] text-ink-500">
          Category
        </label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="min-w-[220px]"
        >
          <option value="All">All categories ({rows.length})</option>
          {categories.map((c) => {
            const n = rows.filter((r) => r.categoryName === c).length;
            return (
              <option key={c} value={c}>
                {c} ({n})
              </option>
            );
          })}
        </select>
        <span className="text-sm text-ink-500">
          {items.length} {items.length === 1 ? "work" : "works"}
        </span>
        {saving && <span className="text-xs text-ink-400">Saving…</span>}
      </div>

      <p className="text-sm text-ink-500">
        {canReorder ? (
          <>
            Use <span className="font-medium text-ink-700">←</span> /{" "}
            <span className="font-medium text-ink-700">→</span> to set the order of
            works in this category. Click a work to edit its photos.
          </>
        ) : (
          <>Pick a category above to reorder its works.</>
        )}
      </p>

      {/* grid */}
      {items.length === 0 ? (
        <p className="rounded-[8px] border border-dashed border-ink-200 px-4 py-10 text-center text-sm text-ink-400">
          No works in this category yet.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((p, i) => (
            <li
              key={p.id}
              className="overflow-hidden rounded-[8px] border border-ink-200 bg-white"
            >
              <Link href={`/admin/paintings/${p.id}`} className="group block">
                <div className="relative">
                  {canReorder && (
                    <span className="absolute left-2 top-2 z-10 grid h-6 w-6 place-items-center rounded-full bg-ink-900/75 text-xs font-medium text-ink-50">
                      {i + 1}
                    </span>
                  )}
                  {p.coverPhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverPhotoUrl}
                      alt={p.title}
                      loading="lazy"
                      decoding="async"
                      className="aspect-square w-full bg-ink-100 object-cover"
                    />
                  ) : (
                    <div className="grid aspect-square w-full place-items-center bg-ink-100 text-xs text-ink-400">
                      no image
                    </div>
                  )}
                </div>
                <span className="block truncate px-2.5 pt-2 text-sm text-ink-700 group-hover:text-ink-900">
                  {p.title}
                </span>
              </Link>

              {/* reorder toolbar */}
              <div className="flex items-center justify-between gap-1 px-2 py-2">
                {canReorder ? (
                  <div className="flex items-center gap-1">
                    <IconBtn
                      title="Move earlier"
                      disabled={i === 0 || saving}
                      onClick={() => move(i, -1)}
                    >
                      ←
                    </IconBtn>
                    <IconBtn
                      title="Move later"
                      disabled={i === items.length - 1 || saving}
                      onClick={() => move(i, 1)}
                    >
                      →
                    </IconBtn>
                  </div>
                ) : (
                  <span className="text-xs text-ink-400">{p.categoryName}</span>
                )}
                <Link
                  href={`/admin/paintings/${p.id}`}
                  className="text-xs text-ink-500 underline decoration-ink-300 underline-offset-2 hover:text-ink-900"
                >
                  Edit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="grid h-7 w-7 place-items-center rounded-[5px] border border-ink-200 text-sm text-ink-700 transition-colors hover:border-ink-900 hover:text-ink-900 disabled:cursor-not-allowed disabled:opacity-30"
    >
      {children}
    </button>
  );
}
