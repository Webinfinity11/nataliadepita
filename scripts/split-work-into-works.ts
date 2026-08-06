import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { featured, paintings, photos } from "../src/db/schema";
import { uniqueSlug } from "../src/lib/slug";

// A category page shows one card per work, so a category whose photographs all
// live inside a single work renders as one lonely card. This splits such a work
// into one work per photograph — the shape every other category already has.
//
//   npx tsx scripts/split-work-into-works.ts <paintingId> [--dry]
//
// Neon's HTTP driver has no interactive transactions, so the steps are ordered
// to be safe if interrupted: the new works are created first (purely additive),
// the photographs are moved one at a time, and the now-empty original is
// removed only once it provably holds nothing — `photos` cascades on delete,
// and a stray photo would be destroyed along with its parent.

async function main() {
  const [idArg, ...flags] = process.argv.slice(2);
  const dry = flags.includes("--dry");
  const sourceId = Number(idArg);
  if (!Number.isInteger(sourceId) || sourceId <= 0) {
    console.error("usage: tsx scripts/split-work-into-works.ts <paintingId> [--dry]");
    process.exit(1);
  }

  const [source] = await db
    .select()
    .from(paintings)
    .where(eq(paintings.id, sourceId));
  if (!source) {
    console.error(`No work with id ${sourceId}.`);
    process.exit(1);
  }

  const shots = await db
    .select()
    .from(photos)
    .where(eq(photos.paintingId, sourceId))
    .orderBy(asc(photos.position), asc(photos.id));
  if (shots.length < 2) {
    console.error(
      `"${source.title}" holds ${shots.length} photo(s) — nothing to split.`,
    );
    process.exit(1);
  }

  // A featured slide pointing at this work would be dragged down with it.
  const slides = await db
    .select({ id: featured.id })
    .from(featured)
    .where(eq(featured.paintingId, sourceId));
  if (slides.length) {
    console.error(
      `Refusing to run: ${slides.length} featured slide(s) reference this work. ` +
        `Detach them under Admin → Featured first.`,
    );
    process.exit(1);
  }

  const siblings = await db
    .select({ slug: paintings.slug, position: paintings.position })
    .from(paintings)
    .where(eq(paintings.categoryId, source.categoryId));
  const taken = siblings.map((s) => s.slug);
  // Titles follow the numbering the other portfolio categories already use;
  // renaming any of them afterwards is one field in Admin → Paintings.
  const planned = shots.map((shot, i) => {
    const slug = uniqueSlug(String(i + 1), taken);
    taken.push(slug);
    return { shot, title: String(i + 1), slug, position: i };
  });

  console.log(
    `Splitting "${source.title}" (#${sourceId}) into ${planned.length} works:`,
  );
  for (const p of planned) {
    console.log(
      `  ${p.title}  (/${p.slug})  ← photo #${p.shot.id} ${p.shot.width}x${p.shot.height}`,
    );
  }
  if (dry) {
    console.log("\nDry run — the database was not touched.");
    process.exit(0);
  }

  for (const p of planned) {
    const [created] = await db
      .insert(paintings)
      .values({
        title: p.title,
        slug: p.slug,
        categoryId: source.categoryId,
        coverPhotoUrl: p.shot.url,
        position: p.position,
      })
      .returning({ id: paintings.id });
    await db
      .update(photos)
      .set({ paintingId: created.id, position: 0 })
      .where(eq(photos.id, p.shot.id));
    console.log(`  moved photo #${p.shot.id} → work #${created.id} "${p.title}"`);
  }

  const left = await db
    .select({ id: photos.id })
    .from(photos)
    .where(eq(photos.paintingId, sourceId));
  if (left.length) {
    console.error(
      `\nStopped before cleanup: ${left.length} photo(s) still hang off #${sourceId}. ` +
        `Nothing was deleted — re-run to finish, or move them by hand.`,
    );
    process.exit(1);
  }

  await db.delete(paintings).where(eq(paintings.id, sourceId));
  console.log(`\nRemoved the now-empty "${source.title}" (#${sourceId}).`);
  console.log("Reorder or rename the new works under Admin → Paintings.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
