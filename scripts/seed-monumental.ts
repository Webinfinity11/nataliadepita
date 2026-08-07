import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { categories, paintings, projectSections } from "../src/db/schema";

// Lays out the Monumental projects page: the Water Mirrors commission told in
// order — concept, the two lines, the studies, the making — followed by the
// other commissions. Everything it writes is editable afterwards under
// Admin → Categories → Sections, so this only has to be right enough to start.
//
// Run: npx tsx scripts/seed-monumental.ts [--dry]

const CATEGORY = "monument-projects";

// Works the artist asked to be renamed; the slug (and so the URL) is left
// alone, since the old address is already in the world.
const RENAMES: Record<string, string> = {
  "the-composition": "Tergdaleulebi",
  "the-rose-revolution-hope-for-the-future": "Hope for the future",
  untitled: "Street of the future",
};

type Plan = {
  title: string;
  subtitle?: string;
  body?: string;
  layout: "full" | "half";
  works: string[];
};

const PLAN: Plan[] = [
  {
    title: "Water Mirrors",
    subtitle: [
      "Former Presidential Palace of Georgia (Avlabari Residence), Tbilisi",
      "2008–2009",
      "",
      "“The History of Georgia from Mythology to the Present Day”",
      "",
      "89,6 m²",
      "Smalti mosaic",
    ].join("\n"),
    body: [
      "Created for the former Presidential Palace of Georgia, Water Mirrors is a monumental mosaic composition dedicated to the historical memory and cultural identity of Georgia.",
      "The project consists of two large mosaic panels conceived as symbolic mirrors reflecting the country’s journey from mythological origins to the present day. Rather than presenting history as a chronological narrative, the composition explores memory as a continuous flow in which legends, historical events, cultural symbols and personal recollections coexist and merge into a single visual stream.",
      "Water serves as the central metaphor of the project. Like time itself, it connects distant moments, dissolves boundaries and transforms individual fragments into a larger whole. Colours, forms and symbolic figures flow into one another, creating a layered visual narrative open to multiple readings.",
      "The project was realised in collaboration with Travisanutto Mosaici (Italy).",
    ].join("\n\n"),
    layout: "full",
    works: [],
  },
  { title: "First line", layout: "half", works: ["first-line-view"] },
  { title: "Second line", layout: "half", works: ["second-line"] },
  {
    title: "Study paintings",
    layout: "full",
    works: ["study-painting", "study-final-version"],
  },
  {
    title: "Abstract fragments",
    layout: "half",
    works: [
      "56",
      "57",
      "58",
      "59",
      "60",
      "61",
      "62",
      "63",
      "64",
      "65",
      "66",
      "67",
      "68",
      "69",
      "69a",
      "69b",
    ],
  },
  {
    title: "Figurative",
    layout: "half",
    // The artist's order, start to finish.
    works: [
      "king-aeetes-medea-the-argonauts-the-golden-fleece-and-prometheus-the-symbol-of-freedom-and-devotion",
      "parnavaz-the-first-king-of-the-kingdom-of-kartli-iberia-the-unifier-of-georgians-creator-of-the-georgian-alphabet",
      "saint-nino-from-cappadocia-preacher-and-spreader-of-christianity-in-georgia-in-the-first-quarter-of-iv-century-king-mirian-queen-nana",
      "king-vakhtang-gorgasali-king-of-kartli-in-v-century-the-founder-of-tbilisi",
      "bagrat-iii-the-first-king-of-unified-and-feudal-georgia-975-1014",
      "the-battle-of-didgori-with-leadership-of-king-david-the-builder-united-army-of-georgia-defeated-the-army-of-seljuk-turks-in-1121",
      "david-iv-the-builder-1089-1125",
      "queen-tamar-called-king-tamar-1184-1213-the-rulers-of-unified-georgia",
      "shota-rustaveli-great-poet-and-mastermind-of-the-xii-century-georgia",
      "saint-king-demetre",
      "giorgi-saakadze-great-georgian-military-commander",
      "saint-ketevan",
      "the-battle-of-krtsanisi-fatal-fight-of-georgians-under-king-erekle-ii-against-the-multitudinous-army-of-agha-makhmad-khan-in-1795",
      "the-composition",
      "renaissance-of-the-georgian-culture-in-the-xix-century-galaktion-the-king-of-poets-his-immortal-poem",
      "the-second-half-of-xx-century-transitional-period-civil-war-chaos-tragedy-of-april-9th",
      "the-rose-revolution-hope-for-the-future",
      "untitled",
    ],
  },
  {
    title: "Making the mosaic",
    layout: "full",
    works: ["71", "73", "78", "82", "83", "finished1", "finished2"],
  },
  {
    title: "Batumi Piazza",
    layout: "full",
    works: [
      "batumi-piazza",
      "batumi-piazza-2",
      "batumi-piazza-3",
      "batumi-piazza-4",
      "batumi-piazza-5",
      "batumi-piazza-6",
      "batumi-piazza-7",
      "batumi-piazza-8",
      "batumi-piazza-9",
      "batumi-piazza-10",
    ],
  },
  {
    title: "Europe Square, Batumi",
    layout: "full",
    works: [
      "europe-square-batumi",
      "europe-square-batumi-2",
      "europe-square-batumi-3",
      "europe-square-batumi-4",
      "europe-square-batumi-5",
      "europe-square-batumi-6",
      "europe-square-batumi-7",
      "europe-square-batumi-8",
      "europe-square-batumi-9",
      "europe-square-batumi-10",
      "border2-study",
    ],
  },
];

async function main() {
  const dry = process.argv.includes("--dry");
  const [cat] = await db
    .select()
    .from(categories)
    .where(eq(categories.slug, CATEGORY));
  if (!cat) throw new Error(`No category /${CATEGORY}`);

  const works = await db
    .select({ id: paintings.id, slug: paintings.slug, title: paintings.title })
    .from(paintings)
    .where(eq(paintings.categoryId, cat.id))
    .orderBy(asc(paintings.position), asc(paintings.id));
  const bySlug = new Map(works.map((w) => [w.slug, w]));

  const missing = PLAN.flatMap((s) => s.works).filter((s) => !bySlug.has(s));
  if (missing.length) throw new Error(`Not in the category: ${missing.join(", ")}`);
  const planned = new Set(PLAN.flatMap((s) => s.works));
  const left = works.filter((w) => !planned.has(w.slug));
  if (left.length) {
    console.log(
      `Left without a section (they still show at the foot of the page): ${left
        .map((w) => w.slug)
        .join(", ")}`,
    );
  }

  if (dry) {
    for (const s of PLAN) {
      console.log(`${s.layout.padEnd(4)} ${s.title} — ${s.works.length} works`);
    }
    for (const [slug, title] of Object.entries(RENAMES)) {
      console.log(`rename ${slug}: "${bySlug.get(slug)?.title}" → "${title}"`);
    }
    process.exit(0);
  }

  // Start from a clean slate so a re-run is not a second set of sections.
  await db
    .delete(projectSections)
    .where(eq(projectSections.categoryId, cat.id));

  // One running number across the category: works are ordered by position, so
  // laying them out section by section puts each one where the plan says.
  let pos = 0;
  for (const [i, s] of PLAN.entries()) {
    const [row] = await db
      .insert(projectSections)
      .values({
        categoryId: cat.id,
        title: s.title,
        subtitle: s.subtitle ?? null,
        body: s.body ?? null,
        layout: s.layout,
        position: i,
      })
      .returning({ id: projectSections.id });
    for (const slug of s.works) {
      const w = bySlug.get(slug)!;
      await db
        .update(paintings)
        .set({ sectionId: row.id, position: pos++ })
        .where(eq(paintings.id, w.id));
    }
    console.log(`${s.title} — ${s.works.length} works`);
  }
  for (const w of left) {
    await db
      .update(paintings)
      .set({ sectionId: null, position: pos++ })
      .where(eq(paintings.id, w.id));
  }

  for (const [slug, title] of Object.entries(RENAMES)) {
    const w = bySlug.get(slug);
    if (!w) continue;
    await db.update(paintings).set({ title }).where(eq(paintings.id, w.id));
    console.log(`renamed "${w.title}" → "${title}" (still at /${CATEGORY}/${slug})`);
  }

  console.log("Done — edit any of it under Admin → Categories → Sections.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
