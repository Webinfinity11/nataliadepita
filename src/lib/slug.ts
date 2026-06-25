export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function uniqueSlug(base: string, taken: string[]): string {
  const s = slugify(base) || "item";
  if (!taken.includes(s)) return s;
  let n = 2;
  while (taken.includes(`${s}-${n}`)) n++;
  return `${s}-${n}`;
}
