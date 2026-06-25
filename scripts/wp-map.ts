// Maps an old WordPress page (by id) to a new category name.
// Image URLs are collected per page during the run; this only declares
// categories + ordering.
export const WP_BASE = "https://nataliadepita.com";

export const PAGE_TO_CATEGORY: { pageId: number; category: string }[] = [
  { pageId: 311, category: "Paintings" },
  { pageId: 313, category: "Black & White" },
  { pageId: 722, category: "Body of the City" },
  { pageId: 720, category: "Tower of Babel" },
  { pageId: 726, category: "Psyché" },
  { pageId: 724, category: "World Future" },
  // mosaic projects
  { pageId: 592, category: "Presidential Palace — Façade" },
  { pageId: 587, category: "Presidential Palace — Courtyard" },
  { pageId: 630, category: "Piazza Square, Batumi" },
  { pageId: 632, category: "Europe Square, Batumi" },
];
