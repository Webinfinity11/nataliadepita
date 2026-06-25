"use client";

import { deleteCategory } from "./actions";

export function DeleteCategoryButton({
  id,
  name,
  count,
}: {
  id: number;
  name: string;
  count: number;
}) {
  return (
    <form
      action={deleteCategory}
      onSubmit={(e) => {
        const msg =
          count > 0
            ? `Delete "${name}" and its ${count} work${count === 1 ? "" : "s"} (and their photos)? This cannot be undone.`
            : `Delete "${name}"?`;
        if (!confirm(msg)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button className="text-sm text-red-600">Delete</button>
    </form>
  );
}
