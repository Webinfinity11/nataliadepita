# Natalia de Pita — Gallery Portfolio (Design Spec)

**Date:** 2026-06-25
**Status:** Approved (design phase)
**Source site to migrate from:** https://nataliadepita.com (WordPress 5.3, custom "core" theme, page-based galleries)

## 1. Purpose & Scope

A display-only portfolio gallery (no e-commerce, no prices, no cart). An admin
manages all content; visitors browse paintings by category, view individual
painting pages, read a blog, and contact the artist via a form.

Language: **English only** for now. The data model should not hard-code
English so a second language (Georgian) can be added later, but no i18n UI is
built now.

Visual design is **not** part of this spec — structure and functionality only.
Styling will be layered on afterward.

## 2. Architecture

A single **Next.js (App Router)** application deployed on Vercel, containing
both the public site and the admin panel.

- **Framework:** Next.js (App Router) + TypeScript
- **Database:** Neon Postgres + Drizzle ORM
- **Image storage:** Vercel Blob, served via `next/image`
- **Auth:** Credentials-based, single admin account, session cookie
- **Rich text:** Tiptap editor (admin) → stored and rendered on the public side
- **Styling:** Tailwind CSS (placeholder styling; replaced later)
- **Migration:** a separate one-off Node script (not part of the deployed app)

## 3. Data Model

- **categories** — `id, name, slug, description?, coverPhotoUrl?, position, createdAt`
- **paintings** — `id, title, description? (nullable), categoryId, coverPhotoUrl, position, createdAt`
  - One painting belongs to exactly **one** category.
  - `description` nullable — when empty, the painting page shows only the title.
- **photos** — `id, paintingId, url, width, height, position, createdAt`
  - Each painting has a main/cover photo plus an additional gallery of photos.
- **featured** — `id, paintingId, position`
  - Powers the home-page slider; admin-selected and ordered.
- **blog_posts** — `id, title, slug, coverPhotoUrl, body (rich-text HTML/JSON), status (draft|published), publishedAt, createdAt`
- **site_settings** — single-row (or key/value): `aboutContent (rich-text), contactEmail, phone, socialLinks (facebook, instagram, ...)`
- **contact_messages** — `id, name, email, message, createdAt, read (bool)`
- **admin_users** — `id, email, passwordHash` (single seeded record)

## 4. Public Pages

- **`/`** — an effective **slider** of admin-selected featured paintings.
  - For now the slider items are **not** clickable / do not navigate anywhere
    (this will be changed later). Below the slider, optional category blocks.
- **`/[category-slug]`** — grid of the category's paintings (cover photos).
- **`/[category-slug]/[painting-slug]`** — painting detail page: large main
  photo + additional photo gallery + title + description (description hidden
  when empty).
- **`/blog`** — list of published posts; **`/blog/[slug]`** — single post
  (rich-text body + cover + date).
- **`/about`** — admin-editable rich-text content.
- **`/contact`** — contact **form** (name, email, message) + admin-managed
  contact info (email, phone, social links). Submissions are stored in
  `contact_messages` and visible in the admin panel. Optional email
  notification to the admin.

## 5. Admin Panel (`/admin`)

Protected behind login. Single admin (email + password, session cookie).

- **Login** page.
- **Categories** — create / edit / delete + reorder (`position`).
- **Paintings** — create / edit / delete; upload main photo + gallery photos to
  Vercel Blob; assign a single category; reorder.
- **Home slider (Featured)** — select paintings and order them.
- **Blog** — CRUD with a **Tiptap rich-text editor** (headings, bold, lists,
  inline images); draft / publish.
- **Settings / Pages** — edit About content and contact info (email, phone,
  social links).
- **Messages** — view contact-form submissions; mark as read.

All `/admin/*` routes guarded; unauthenticated users redirected to login.

## 6. Migration Script (WordPress → new site)

A standalone one-off Node script (run locally, not deployed):

- Pulls images from the old site via `wp-json` (media endpoint) and/or the
  `wp-content/uploads` paths.
- A **config file maps old WordPress pages → new categories** (e.g.
  "Black & White", "Body of the City", "Tower of Babel", "Psyché",
  "World Future", mosaic projects). The old site is page-based, so a small
  amount of manual mapping is expected; the script automates the rest.
- Downloads each image, uploads it to Vercel Blob, and creates the
  corresponding `categories`, `paintings`, and `photos` records.

## 7. Image Handling

- Uploads validated by type and size on the server before going to Blob.
- Image dimensions (`width`, `height`) stored with each photo so `next/image`
  can render responsively with correct aspect ratios.

## 8. Error Handling & Testing

- Validation: file type/size on upload, invalid login, empty description
  handled gracefully (title-only display).
- Auth guard on all admin routes.
- Tests for core flows: CRUD operations, auth guard, contact-form submission,
  slug uniqueness.

## 9. Visual Design Direction

Reference: **https://www.galengibsoncornell.com/** (Squarespace, minimalist
editorial artist portfolio). The new site adapts this aesthetic.

- **Mood:** minimalist, editorial, "gallery wall" — the artwork is the focus and
  the interface is nearly invisible. Generous whitespace throughout.
- **Color:** light / white (or off-white) background, dark high-contrast text.
  No heavy chrome or decorative color.
- **Typography (serif-led):** `Newsreader` for body and headings, with
  `Instrument Serif` for large display accents (e.g. hero/section titles). Both
  available on Google Fonts.
- **Navigation:** top horizontal menu (Portfolio/categories, Blog, About,
  Contact); collapses to a hamburger on mobile.
- **Home hero:** the featured slider presented large, near full-width, one work
  at a time — gallery-like.
- **Gallery grid:** clean grid with generous spacing; cover photos breathe.
- **Painting page:** large main image, additional photos below, title (and
  description when present) set in the serif type.

This direction guides styling; the underlying structure (sections 2–8) is
unchanged. Exact spacing/animation details are refined during implementation.

## 10. Out of Scope (now)

- Second language / i18n UI.
- Prices, cart, checkout, any commerce.
- Slider click-through navigation (deferred).
- Multiple admin roles.
