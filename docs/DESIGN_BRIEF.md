# Natalia de Pita — Design Brief (all pages)

> **Purpose of this document.** This is a complete, page-by-page brief for
> designing the visual layer of the site. The site is already **built and
> functional** — structure, routes, data, and components exist. Design work
> layers visual styling on top of this fixed structure; it does NOT change what
> data each page shows or how navigation works. For every page below, design a
> **desktop** and a **mobile** layout that fits the structure and honors the art
> direction. Keep the listed content fields and states — don't invent new data.

---

## 1. The artist & the goal

Natalia Amirejibi de Pita — painter and monumental **mosaic** artist (works
include the Georgian Presidential Palace and public squares in Batumi). The site
is a **display-only portfolio** (no shop, no prices, no cart). The goal: let the
artwork dominate; the interface should feel like a quiet gallery wall.

**Language:** English only.

## 2. Art direction

Reference: **galengibsoncornell.com** — minimalist, editorial, gallery-like.

- **Mood:** calm, refined, "museum wall." Interface nearly invisible; images and
  generous whitespace carry the page.
- **Background:** light / white (or warm off-white). High-contrast dark text.
- **Typography (serif-led, already wired in):**
  - `Newsreader` — body text, most headings, navigation.
  - `Instrument Serif` — large display accents (hero title, page titles).
    Available in code as the CSS class `.font-display`.
- **Color:** essentially monochrome — white, near-black (`#171717`), and grays.
  At most one restrained accent (optional). Let the paintings be the color.
- **Spacing:** large, confident whitespace. Wide margins, airy grids.
- **Imagery:** never crop a painting awkwardly; prefer `object-contain` or tall
  portrait frames; let pieces breathe.
- **Motion:** subtle only — gentle crossfades, slow hover scale. No flashy UI.

**Do:** elegant serif headings, big margins, thin hairline dividers, restrained.
**Don't:** drop shadows everywhere, bright UI colors, dense cards, busy gradients.

## 3. Design system / tokens to define

Produce a small system the pages reuse:

- **Type scale:** display (hero ~clamp 3–5rem, Instrument Serif), H1, H2, H3,
  body, small/meta — all serif.
- **Color tokens:** `background`, `text`, `muted-text` (~neutral-600),
  `hairline/border` (~neutral-200), optional `accent`.
- **Spacing scale:** section padding, content max-widths (content ~`max-w-3xl`,
  gallery ~`max-w-6xl`).
- **Components to style** (these already exist in code — see §6): top nav, footer,
  hero slider, painting grid card, lightbox, rich-text (`prose`) blocks, forms,
  buttons, inputs.
- **States:** hover, focus, disabled, empty ("No posts yet."), error (form),
  success (form), loading ("Uploading…").
- **Responsive breakpoints:** mobile (<640), tablet (640–1024), desktop (>1024).
  Top nav collapses to a hamburger on mobile.

---

## 4. Global chrome (every public page)

**Header / nav** — `src/app/(public)/layout.tsx`
- Left: wordmark "Natalia de Pita" (display serif), links home.
- Right: horizontal nav — one link per **category** (dynamic, e.g. Paintings,
  Black & White, Body of the City, Tower of Babel, Psyché, World Future, mosaic
  projects), then **Blog**, **About**, **Contact**.
- Mobile: collapses to a hamburger menu (design the open/closed states).
- Style: thin bottom hairline, lots of breathing room.

**Footer** — same file
- Contact email, phone, and social links (admin-managed; may be absent — design
  for "some present, some empty").
- Minimal: small serif text, hairline top border.

---

## 5. Pages

For each: **route** · what it is · sections to design · content fields · states.

### 5.1 Home — `/`  (`src/app/(public)/page.tsx`, `components/HomeSlider.tsx`)
- **Hero slider**: large, near full-width (currently `h-[70vh]`), one featured
  image at a time, auto-advancing crossfade, dot indicators at the bottom.
  **Important:** slider images are **NOT clickable** (no navigation) for now —
  design it as a pure showcase, not a button.
- Below the slider: a short centered intro block — display title "Natalia
  Amirejibi de Pita" + one line "Paintings and monumental mosaics."
- **States:** slider may have 1 image (no dots/auto-advance) or many; design both.
  Empty (no featured selected) → slider hidden, just the intro.
- Design the hero to feel like walking into a gallery.

### 5.2 Category — `/[category]`  (`[category]/page.tsx`, `components/PaintingGrid.tsx`)
- **Header**: category name (display serif) + optional description paragraph
  (may be absent).
- **Grid** of paintings: each cell = cover photo (portrait ~4:5) + title below.
  Currently 2 cols mobile / 3 desktop — you may refine (masonry is acceptable if
  it stays calm). Gentle hover (slow zoom).
- Clicking a cell → painting page.
- **States:** category with many works; category with few/none (design an empty
  state); titles of varying length.

### 5.3 Painting detail — `/[category]/[painting]`  (`.../[painting]/page.tsx`, `components/Lightbox.tsx`)
- **Main image** large, centered, `object-contain` (the focal point — "view it
  well"). Click → fullscreen overlay (dark backdrop, image centered).
- **Thumbnail row** below main image when the painting has more than one photo
  (main photo + gallery). Selected thumbnail highlighted.
- **Title** (display serif) under the images.
- **Description** paragraph — **optional**: when empty, show title only (design
  must look intentional with no description).
- **States:** single photo (no thumbnails); many photos; long vs no description;
  fullscreen open.

### 5.4 Blog list — `/blog`  (`blog/page.tsx`)
- List of **published** posts, newest first. Each entry: optional cover image
  (16:9), title (display serif), date.
- **States:** posts with/without cover; empty ("No posts yet.").

### 5.5 Blog post — `/blog/[slug]`  (`blog/[slug]/page.tsx`, `components/RichText.tsx`)
- Title (display), date, optional cover (16:9), then **rich-text body**
  (`prose`): headings (H2/H3), bold, italic, lists, blockquotes, inline images,
  links. Style the `prose` typography to match the serif system.
- Readable measure (~`max-w-3xl`).

### 5.6 About — `/about`  (`about/page.tsx`)
- "About" title + **rich-text body** (admin-editable, same `prose` styling).
- **State:** empty → "Coming soon."

### 5.7 Contact — `/contact`  (`contact/page.tsx`, `contact/ContactForm.tsx`)
- Two columns (desktop): left = **contact form** (name, email, message,
  Send button); right = contact info (email, phone, social links — any may be
  absent). Stacks on mobile.
- **Form states:** default, validation error (red helper text), success ("Thank
  you — your message has been sent." replaces the form).

---

## 6. Component inventory (map designs to real code)

Style these existing components; keep their props/data the same:

| Component | File | Used on |
|-----------|------|---------|
| Public header + footer | `src/app/(public)/layout.tsx` | all public |
| `HomeSlider` | `src/components/HomeSlider.tsx` | home |
| `PaintingGrid` | `src/components/PaintingGrid.tsx` | category |
| `Lightbox` | `src/components/Lightbox.tsx` | painting |
| `RichText` (prose) | `src/components/RichText.tsx` | blog post, about |
| `ContactForm` | `src/app/(public)/contact/ContactForm.tsx` | contact |

Tailwind v4 + the `@tailwindcss/typography` plugin (`prose`) are already set up.
Fonts are loaded via `next/font` as CSS variables `--font-newsreader` and
`--font-instrument` (the `.font-display` class uses the latter).

## 7. Admin pages (utilitarian — low design priority)

`/admin/*` is a private, single-admin tool. It only needs to be clean and
legible (simple forms, sidebar nav) — it does **not** need the gallery art
direction. Pages: login, dashboard, categories, paintings (list + editor with
photo gallery), featured (slider picker), blog (list + Tiptap editor), settings
(about + contact + social links), messages. Design these only if you want a
tidied-up admin; otherwise leave as-is.

## 8. Hard constraints to honor

1. Home slider images are **not clickable** (no link) — for now.
2. Painting **description is optional** — title-only must look intentional.
3. **One painting belongs to one category**; URLs are `/[category]/[painting]`.
4. English only; don't add language switchers.
5. No prices / shop / cart anywhere.
6. Keep each page's data fields exactly as listed — design styling, not new
   features.

## 9. Deliverables

For each public page (§5.1–5.7): a **desktop** and a **mobile** comp, plus the
shared **nav** (desktop + mobile hamburger) and **footer**. Include the key
**states** noted per page (empty, error, success, single vs many images,
fullscreen). Deliver the design system tokens (§3) once, reused across pages.
