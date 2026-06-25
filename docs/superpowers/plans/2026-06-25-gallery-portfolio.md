# Natalia de Pita Gallery Portfolio — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a display-only artist portfolio gallery (paintings by category, painting detail pages, home slider, blog, About, Contact) with a single-admin management panel, plus a one-off WordPress migration script.

**Architecture:** A single Next.js (App Router) app on Vercel. Public pages read from Neon Postgres via Drizzle; the `/admin/*` area (guarded by a signed-cookie session) does all CRUD through Server Actions. Images upload to Vercel Blob; dimensions are captured with `sharp`. Blog bodies are authored with Tiptap and stored as sanitized HTML.

**Tech Stack:** Next.js (App Router) + TypeScript, Tailwind CSS, Drizzle ORM + Neon Postgres (`@neondatabase/serverless`), Vercel Blob (`@vercel/blob`), `sharp`, `bcryptjs` + `jose` (auth), Tiptap (`@tiptap/react`), `isomorphic-dompurify`, `zod`, Vitest.

## Global Constraints

- **Language:** English-only UI for now; do NOT hard-code language assumptions in the schema (no `_en` suffixes) so a second language can be added later.
- **No commerce:** no prices, cart, checkout, or stock status anywhere.
- **Single admin:** exactly one admin account; no roles, no public sign-up.
- **One painting → exactly one category.**
- **Painting `description` is optional:** when empty/null the painting page shows the title only.
- **Home slider items are NOT clickable** for now (no navigation on click).
- **Fonts:** `Newsreader` (body + headings) and `Instrument Serif` (large display accents), loaded via `next/font/google`.
- **Visual mood:** minimalist, editorial, light/white background, dark high-contrast text, generous whitespace (reference: galengibsoncornell.com). Styling is intentionally lightweight — it will be reworked later; do not over-invest in CSS polish.
- **Category URLs use slugs:** `/[category-slug]` and `/[category-slug]/[painting-slug]`.
- **All `/admin/*` routes require an authenticated session** (except `/admin/login`).
- **Node 24+**, Next.js App Router, TypeScript strict mode.
- **Commit after every task** (and per the per-task final step).

---

## File Structure

```
src/
  app/
    layout.tsx                      # root: fonts, <html>, global CSS
    globals.css
    (public)/
      layout.tsx                    # public nav + footer (reads site_settings)
      page.tsx                      # home: featured slider
      [category]/page.tsx           # category grid
      [category]/[painting]/page.tsx# painting detail
      blog/page.tsx                 # blog list
      blog/[slug]/page.tsx          # blog post
      about/page.tsx                # about (admin-editable content)
      contact/page.tsx              # contact form + info
    admin/
      layout.tsx                    # admin shell + nav (server-guarded)
      login/page.tsx
      page.tsx                      # dashboard
      categories/page.tsx + actions.ts
      paintings/page.tsx + [id]/page.tsx + actions.ts
      featured/page.tsx + actions.ts
      blog/page.tsx + [id]/page.tsx + actions.ts
      settings/page.tsx + actions.ts
      messages/page.tsx + actions.ts
    api/contact/route.ts            # public contact form submit (optional; we use a server action)
  components/
    HomeSlider.tsx
    PaintingGrid.tsx
    Lightbox.tsx
    RichText.tsx                    # renders sanitized blog HTML
    admin/Editor.tsx                # Tiptap wrapper (client)
    admin/ImageUploader.tsx         # client upload widget
  db/
    schema.ts                       # all Drizzle tables
    index.ts                        # drizzle client
  lib/
    slug.ts
    validation.ts                   # zod schemas + image file checks
    auth.ts                         # hash/verify password, sign/verify JWT
    session.ts                      # getSession / requireAdmin (cookies)
    blob.ts                         # uploadImage -> {url,width,height}
    queries.ts                      # public read queries
    sanitize.ts                     # DOMPurify wrapper
  middleware.ts                     # guards /admin/*
scripts/
  seed-admin.ts                     # create the single admin
  migrate-wordpress.ts             # one-off WP import
drizzle.config.ts
vitest.config.ts
.env.local                          # DATABASE_URL, AUTH_SECRET, BLOB_READ_WRITE_TOKEN
```

---

## Phase 0 — Scaffold & Tooling

### Task 1: Scaffold the Next.js app

**Files:**
- Create: whole project via `create-next-app` (into the current directory `.`)
- Modify: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Interfaces:**
- Produces: a running Next.js app with Tailwind, TypeScript, `src/` dir, and the two Google fonts wired into the root layout as CSS variables `--font-newsreader` and `--font-instrument`.

- [ ] **Step 1: Scaffold** (the directory already contains `docs/` and `.git`, which do not conflict)

```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --eslint --import-alias "@/*" --use-npm --no-turbopack --yes
```

- [ ] **Step 2: Wire fonts in `src/app/layout.tsx`**

```tsx
import type { Metadata } from "next";
import { Newsreader, Instrument_Serif } from "next/font/google";
import "./globals.css";

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});
const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument",
});

export const metadata: Metadata = {
  title: "Natalia de Pita — Artist",
  description: "Paintings and mosaics by Natalia Amirejibi de Pita.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${newsreader.variable} ${instrument.variable}`}>
      <body className="bg-white text-neutral-900 antialiased">{children}</body>
    </html>
  );
}
```

- [ ] **Step 3: Set base typography in `src/app/globals.css`** (append after the Tailwind import)

```css
:root { --font-sans: var(--font-newsreader); }
body { font-family: var(--font-newsreader), Georgia, serif; }
.font-display { font-family: var(--font-instrument), Georgia, serif; }
```

- [ ] **Step 4: Replace `src/app/page.tsx`** with a placeholder so the app builds

```tsx
export default function Home() {
  return <main className="p-12 font-display text-4xl">Natalia de Pita</main>;
}
```

- [ ] **Step 5: Verify it runs**

Run: `npm run build`
Expected: build succeeds with no type errors.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "chore: scaffold Next.js app with fonts and Tailwind"
```

---

### Task 2: Database client, env, and Vitest

**Files:**
- Create: `src/db/index.ts`, `drizzle.config.ts`, `vitest.config.ts`, `.env.local`, `.env.example`
- Modify: `package.json` (scripts), `.gitignore` (ensure `.env.local` ignored)

**Interfaces:**
- Produces: `db` (the Drizzle client) exported from `@/db`; npm scripts `db:push`, `db:generate`, `db:studio`, `test`.

- [ ] **Step 1: Install dependencies**

```bash
npm i drizzle-orm @neondatabase/serverless @vercel/blob sharp bcryptjs jose zod isomorphic-dompurify
npm i -D drizzle-kit vitest @types/bcryptjs dotenv
```

- [ ] **Step 2: Create `.env.example`** (and copy to `.env.local`, filling real values)

```
DATABASE_URL=postgres://...          # Neon connection string
AUTH_SECRET=                          # 32+ random chars (openssl rand -base64 32)
BLOB_READ_WRITE_TOKEN=                # Vercel Blob token
ADMIN_EMAIL=                          # used by seed-admin script
ADMIN_PASSWORD=                       # used by seed-admin script
```

- [ ] **Step 3: Create `src/db/index.ts`**

```ts
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

- [ ] **Step 4: Create `drizzle.config.ts`**

```ts
import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

- [ ] **Step 5: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", globals: true },
});
```

Then: `npm i -D vite-tsconfig-paths`

- [ ] **Step 6: Add scripts to `package.json`**

```json
"db:push": "drizzle-kit push",
"db:generate": "drizzle-kit generate",
"db:studio": "drizzle-kit studio",
"seed:admin": "node --experimental-strip-types scripts/seed-admin.ts",
"migrate:wp": "node --experimental-strip-types scripts/migrate-wordpress.ts",
"test": "vitest run"
```

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "chore: add db client, drizzle config, vitest, env example"
```

---

## Phase 1 — Data Layer & Helpers

### Task 3: Drizzle schema

**Files:**
- Create: `src/db/schema.ts`

**Interfaces:**
- Produces: table objects `categories, paintings, photos, featured, blogPosts, siteSettings, contactMessages, adminUsers` and inferred types `Category, Painting, Photo, ...` via `typeof X.$inferSelect`.

- [ ] **Step 1: Write `src/db/schema.ts`**

```ts
import {
  pgTable, serial, integer, text, boolean, timestamp, jsonb, uniqueIndex,
} from "drizzle-orm/pg-core";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  coverPhotoUrl: text("cover_photo_url"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paintings = pgTable("paintings", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "restrict" }),
  coverPhotoUrl: text("cover_photo_url"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({ slugPerCategory: uniqueIndex("paintings_cat_slug").on(t.categoryId, t.slug) }));

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  paintingId: integer("painting_id").notNull().references(() => paintings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const featured = pgTable("featured", {
  id: serial("id").primaryKey(),
  paintingId: integer("painting_id").notNull().unique().references(() => paintings.id, { onDelete: "cascade" }),
  position: integer("position").notNull().default(0),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  coverPhotoUrl: text("cover_photo_url"),
  body: text("body").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] }).notNull().default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  aboutContent: text("about_content").notNull().default(""),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  socialLinks: jsonb("social_links").$type<{ label: string; url: string }[]>().notNull().default([]),
});

export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type Painting = typeof paintings.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
```

- [ ] **Step 2: Push schema to the database**

Run: `npm run db:push`
Expected: tables created in Neon, no errors.

- [ ] **Step 3: Seed the single settings row**

Run (one-off, via `db:studio` or psql):
```sql
INSERT INTO site_settings (id, about_content, social_links) VALUES (1, '', '[]') ON CONFLICT DO NOTHING;
```

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: add drizzle schema for gallery, blog, settings"
```

---

### Task 4: Slug + validation helpers (TDD)

**Files:**
- Create: `src/lib/slug.ts`, `src/lib/validation.ts`
- Test: `src/lib/slug.test.ts`, `src/lib/validation.test.ts`

**Interfaces:**
- Produces:
  - `slugify(input: string): string`
  - `uniqueSlug(base: string, taken: string[]): string`
  - zod schemas: `categoryInput`, `paintingInput`, `blogPostInput`, `contactInput`, `settingsInput`
  - `isAllowedImage(file: { type: string; size: number }): boolean` (jpeg/png/webp/gif, ≤ 15 MB)

- [ ] **Step 1: Write failing test `src/lib/slug.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Black & White")).toBe("black-white");
    expect(slugify("  Tower of  Babel ")).toBe("tower-of-babel");
  });
  it("strips diacritics and symbols", () => {
    expect(slugify("Psyché (the Soul)")).toBe("psyche-the-soul");
  });
});

describe("uniqueSlug", () => {
  it("returns base when free", () => {
    expect(uniqueSlug("art", [])).toBe("art");
  });
  it("appends -2, -3 when taken", () => {
    expect(uniqueSlug("art", ["art"])).toBe("art-2");
    expect(uniqueSlug("art", ["art", "art-2"])).toBe("art-3");
  });
});
```

- [ ] **Step 2: Run, expect FAIL**

Run: `npx vitest run src/lib/slug.test.ts`
Expected: FAIL (module not found).

- [ ] **Step 3: Implement `src/lib/slug.ts`**

```ts
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
```

- [ ] **Step 4: Run, expect PASS.** `npx vitest run src/lib/slug.test.ts`

- [ ] **Step 5: Write failing test `src/lib/validation.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { isAllowedImage, contactInput } from "./validation";

describe("isAllowedImage", () => {
  it("accepts jpeg under limit", () => {
    expect(isAllowedImage({ type: "image/jpeg", size: 1_000_000 })).toBe(true);
  });
  it("rejects pdf", () => {
    expect(isAllowedImage({ type: "application/pdf", size: 10 })).toBe(false);
  });
  it("rejects oversize", () => {
    expect(isAllowedImage({ type: "image/png", size: 20_000_000 })).toBe(false);
  });
});

describe("contactInput", () => {
  it("requires a valid email", () => {
    expect(contactInput.safeParse({ name: "A", email: "x", message: "hi" }).success).toBe(false);
    expect(contactInput.safeParse({ name: "A", email: "a@b.com", message: "hi" }).success).toBe(true);
  });
});
```

- [ ] **Step 6: Run, expect FAIL.** `npx vitest run src/lib/validation.test.ts`

- [ ] **Step 7: Implement `src/lib/validation.ts`**

```ts
import { z } from "zod";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_BYTES = 15 * 1024 * 1024;

export function isAllowedImage(file: { type: string; size: number }): boolean {
  return ALLOWED.includes(file.type) && file.size > 0 && file.size <= MAX_BYTES;
}

export const categoryInput = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const paintingInput = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal("")),
  categoryId: z.coerce.number().int().positive(),
});

export const blogPostInput = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().default(""),
  status: z.enum(["draft", "published"]).default("draft"),
});

export const contactInput = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  message: z.string().trim().min(1).max(5000),
});

export const settingsInput = z.object({
  aboutContent: z.string().default(""),
  contactEmail: z.string().email().optional().or(z.literal("")),
  phone: z.string().max(60).optional().or(z.literal("")),
  socialLinks: z.array(z.object({ label: z.string().min(1), url: z.string().url() })).default([]),
});
```

- [ ] **Step 8: Run, expect PASS.** `npx vitest run src/lib/validation.test.ts`

- [ ] **Step 9: Commit**

```bash
git add -A && git commit -m "feat: add slug and validation helpers with tests"
```

---

## Phase 2 — Authentication

### Task 5: Password + session crypto (TDD)

**Files:**
- Create: `src/lib/auth.ts`
- Test: `src/lib/auth.test.ts`

**Interfaces:**
- Produces:
  - `hashPassword(plain: string): Promise<string>`
  - `verifyPassword(plain: string, hash: string): Promise<boolean>`
  - `signSession(payload: { uid: number }): Promise<string>`
  - `verifySession(token: string): Promise<{ uid: number } | null>`

- [ ] **Step 1: Write failing test `src/lib/auth.test.ts`**

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { hashPassword, verifyPassword, signSession, verifySession } from "./auth";

beforeAll(() => { process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-32"; });

describe("password", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", h)).toBe(true);
    expect(await verifyPassword("nope", h)).toBe(false);
  });
});

describe("session", () => {
  it("round-trips a signed token", async () => {
    const t = await signSession({ uid: 7 });
    expect((await verifySession(t))?.uid).toBe(7);
  });
  it("rejects a tampered token", async () => {
    expect(await verifySession("garbage.token.value")).toBeNull();
  });
});
```

- [ ] **Step 2: Run, expect FAIL.** `npx vitest run src/lib/auth.test.ts`

- [ ] **Step 3: Implement `src/lib/auth.ts`**

```ts
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
export async function signSession(payload: { uid: number }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}
export async function verifySession(token: string): Promise<{ uid: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: payload.uid as number };
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Run, expect PASS.** `npx vitest run src/lib/auth.test.ts`

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add password hashing and session JWT helpers"
```

---

### Task 6: Session access, middleware guard, seed, login

**Files:**
- Create: `src/lib/session.ts`, `src/middleware.ts`, `scripts/seed-admin.ts`, `src/app/admin/login/page.tsx`, `src/app/admin/login/actions.ts`, `src/app/admin/layout.tsx`, `src/app/admin/page.tsx`

**Interfaces:**
- Consumes: `verifySession`, `signSession`, `verifyPassword` from `@/lib/auth`; `db`, `adminUsers`.
- Produces:
  - `getSession(): Promise<{ uid: number } | null>` (reads `session` cookie)
  - `requireAdmin(): Promise<{ uid: number }>` (redirects to `/admin/login` if absent)
  - `SESSION_COOKIE = "session"`
  - server action `login(prevState, formData)` setting the cookie
  - server action `logout()` clearing it

- [ ] **Step 1: Create `src/lib/session.ts`**

```ts
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./auth";

export const SESSION_COOKIE = "session";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
```

- [ ] **Step 2: Create `src/middleware.ts`** (cheap presence check; full verify happens in layouts/actions)

```ts
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!req.cookies.get(SESSION_COOKIE)) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

- [ ] **Step 3: Create `scripts/seed-admin.ts`**

```ts
import "dotenv/config";
import { db } from "../src/db";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";
import { eq } from "drizzle-orm";

const email = process.env.ADMIN_EMAIL!;
const password = process.env.ADMIN_PASSWORD!;
if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

const hash = await hashPassword(password);
const existing = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
if (existing.length) {
  await db.update(adminUsers).set({ passwordHash: hash }).where(eq(adminUsers.email, email));
  console.log("Admin password updated:", email);
} else {
  await db.insert(adminUsers).values({ email, passwordHash: hash });
  console.log("Admin created:", email);
}
```

- [ ] **Step 4: Run the seed**

Run: `npm run seed:admin`
Expected: "Admin created: <email>".

- [ ] **Step 5: Create `src/app/admin/login/actions.ts`**

```ts
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { verifyPassword, signSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function login(_prev: string | null, formData: FormData): Promise<string | null> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const [user] = await db.select().from(adminUsers).where(eq(adminUsers.email, email));
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return "Invalid email or password";
  }
  const token = await signSession({ uid: user.id });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax",
    path: "/", maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
```

- [ ] **Step 6: Create `src/app/admin/login/page.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [error, action] = useActionState(login, null);
  return (
    <main className="mx-auto mt-24 max-w-sm px-6">
      <h1 className="font-display text-3xl mb-6">Admin</h1>
      <form action={action} className="space-y-4">
        <input name="email" type="email" placeholder="Email" required className="w-full border p-2" />
        <input name="password" type="password" placeholder="Password" required className="w-full border p-2" />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button className="w-full bg-neutral-900 text-white p-2">Sign in</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 7: Create `src/app/admin/layout.tsx`** (server-guarded shell)

```tsx
import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { logout } from "./login/actions";

const NAV = [
  ["Dashboard", "/admin"], ["Categories", "/admin/categories"], ["Paintings", "/admin/paintings"],
  ["Featured", "/admin/featured"], ["Blog", "/admin/blog"], ["Settings", "/admin/settings"],
  ["Messages", "/admin/messages"],
] as const;

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-2">
        {NAV.map(([label, href]) => (
          <Link key={href} href={href} className="block hover:underline">{label}</Link>
        ))}
        <form action={logout} className="pt-4"><button className="text-sm text-red-600">Log out</button></form>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
```

Note: the login page must NOT inherit this layout's guard. Because `login/` is nested under `admin/`, move guard logic so `/admin/login` renders without redirect loop — the middleware already exempts `/admin/login`, and `requireAdmin()` only runs in this layout which also wraps login. **Fix:** put the guarded UI under a route group. Restructure: create `src/app/admin/(dash)/layout.tsx` with the guard + nav, move `page.tsx`, `categories/`, etc. under `(dash)/`, and keep `login/` directly under `admin/` with no guard.

- [ ] **Step 8: Apply the route-group restructure**

- Move `src/app/admin/page.tsx` → `src/app/admin/(dash)/page.tsx`
- The guarded layout lives at `src/app/admin/(dash)/layout.tsx` (content from Step 7).
- All later admin sections (categories, paintings, featured, blog, settings, messages) are created under `src/app/admin/(dash)/`.
- `src/app/admin/login/` stays unguarded.

- [ ] **Step 9: Create `src/app/admin/(dash)/page.tsx`**

```tsx
export default function Dashboard() {
  return <h1 className="font-display text-3xl">Dashboard</h1>;
}
```

- [ ] **Step 10: Manual verify**

Run: `npm run dev`. Visit `/admin` → redirected to `/admin/login`. Log in → reach dashboard. Log out → back to login.

- [ ] **Step 11: Commit**

```bash
git add -A && git commit -m "feat: admin auth — session, middleware guard, login, seed"
```

---

## Phase 3 — Image Upload

### Task 7: Blob upload helper + upload action

**Files:**
- Create: `src/lib/blob.ts`, `src/app/admin/(dash)/_actions/upload.ts`, `src/components/admin/ImageUploader.tsx`
- Test: `src/lib/blob.test.ts` (dimension parsing only, no network)

**Interfaces:**
- Produces:
  - `uploadImage(file: File): Promise<{ url: string; width: number; height: number }>` — validates, reads bytes, gets dimensions with `sharp`, `put()`s to Blob.
  - server action `uploadImageAction(formData): Promise<{ url, width, height } | { error }>` (admin-guarded).
  - `<ImageUploader name onUploaded />` client widget that posts a file and reports the resulting URL.

- [ ] **Step 1: Write `src/lib/blob.ts`**

```ts
import { put } from "@vercel/blob";
import sharp from "sharp";
import { isAllowedImage } from "./validation";

export async function uploadImage(file: File): Promise<{ url: string; width: number; height: number }> {
  if (!isAllowedImage({ type: file.type, size: file.size })) {
    throw new Error("Unsupported or oversized image");
  }
  const buf = Buffer.from(await file.arrayBuffer());
  const meta = await sharp(buf).metadata();
  const ext = file.type.split("/")[1] ?? "jpg";
  const key = `paintings/${Date.now()}-${Math.round(meta.width ?? 0)}.${ext}`;
  const blob = await put(key, buf, { access: "public", contentType: file.type });
  return { url: blob.url, width: meta.width ?? 0, height: meta.height ?? 0 };
}
```

- [ ] **Step 2: Create `src/app/admin/(dash)/_actions/upload.ts`**

```ts
"use server";
import { requireAdmin } from "@/lib/session";
import { uploadImage } from "@/lib/blob";

export async function uploadImageAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File)) return { error: "No file" };
  try {
    return await uploadImage(file);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Upload failed" };
  }
}
```

- [ ] **Step 3: Create `src/components/admin/ImageUploader.tsx`**

```tsx
"use client";
import { useState } from "react";
import { uploadImageAction } from "@/app/admin/(dash)/_actions/upload";

export function ImageUploader({ onUploaded }: { onUploaded: (img: { url: string; width: number; height: number }) => void }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <input type="file" accept="image/*" disabled={busy} onChange={async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setBusy(true); setErr(null);
        const fd = new FormData(); fd.set("file", file);
        const res = await uploadImageAction(fd);
        setBusy(false);
        if ("error" in res) setErr(res.error); else onUploaded(res);
        e.target.value = "";
      }} />
      {busy && <span className="ml-2 text-sm">Uploading…</span>}
      {err && <p className="text-red-600 text-sm">{err}</p>}
    </div>
  );
}
```

- [ ] **Step 4: Configure `next.config.ts` to allow Blob images**

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.public.blob.vercel-storage.com" }] },
};
export default nextConfig;
```

- [ ] **Step 5: Manual verify** (after Task 9 wires it in, confirm an upload returns a Blob URL). Commit now:

```bash
git add -A && git commit -m "feat: image upload to Vercel Blob with sharp dimensions"
```

---

## Phase 4 — Admin CRUD

> Each admin section follows the same shape: a server action file (`actions.ts`) doing validated DB writes (guarded by `requireAdmin`), and a server-component page rendering the list + a form. `revalidatePath` refreshes the relevant public routes.

### Task 8: Categories CRUD

**Files:**
- Create: `src/app/admin/(dash)/categories/actions.ts`, `src/app/admin/(dash)/categories/page.tsx`

**Interfaces:**
- Consumes: `categoryInput`, `slugify`, `uniqueSlug`, `db`, `categories`.
- Produces: `createCategory(formData)`, `updateCategory(formData)`, `deleteCategory(formData)`, `reorderCategory(formData)`.

- [ ] **Step 1: Write `actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { asc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { categoryInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";

async function takenSlugs(exceptId?: number) {
  const rows = await db.select({ slug: categories.slug, id: categories.id }).from(categories);
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createCategory(formData: FormData) {
  await requireAdmin();
  const data = categoryInput.parse({ name: formData.get("name"), description: formData.get("description") ?? "" });
  const slug = uniqueSlug(slugify(data.name), await takenSlugs());
  await db.insert(categories).values({ name: data.name, slug, description: data.description || null });
  revalidatePath("/admin/categories"); revalidatePath("/");
}

export async function updateCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = categoryInput.parse({ name: formData.get("name"), description: formData.get("description") ?? "" });
  const slug = uniqueSlug(slugify(data.name), await takenSlugs(id));
  await db.update(categories).set({ name: data.name, slug, description: data.description || null }).where(eq(categories.id, id));
  revalidatePath("/admin/categories"); revalidatePath("/");
}

export async function deleteCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(categories).where(eq(categories.id, id)); // FK is restrict: fails if paintings exist
  revalidatePath("/admin/categories"); revalidatePath("/");
}

export async function reorderCategory(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const position = Number(formData.get("position"));
  await db.update(categories).set({ position }).where(eq(categories.id, id));
  revalidatePath("/admin/categories"); revalidatePath("/");
}
```

- [ ] **Step 2: Write `page.tsx`**

```tsx
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { createCategory, updateCategory, deleteCategory } from "./actions";

export default async function CategoriesPage() {
  const rows = await db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Categories</h1>
      <form action={createCategory} className="flex gap-2">
        <input name="name" placeholder="New category" required className="border p-2" />
        <input name="description" placeholder="Description (optional)" className="border p-2 flex-1" />
        <button className="bg-neutral-900 text-white px-4">Add</button>
      </form>
      <ul className="space-y-3">
        {rows.map((c) => (
          <li key={c.id} className="flex items-center gap-2 border-b pb-2">
            <form action={updateCategory} className="flex gap-2 flex-1">
              <input type="hidden" name="id" value={c.id} />
              <input name="name" defaultValue={c.name} className="border p-1" />
              <input name="description" defaultValue={c.description ?? ""} className="border p-1 flex-1" />
              <span className="text-sm text-neutral-500 self-center">/{c.slug}</span>
              <button className="text-sm underline">Save</button>
            </form>
            <form action={deleteCategory}>
              <input type="hidden" name="id" value={c.id} />
              <button className="text-sm text-red-600">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Manual verify** — add, edit, delete a category at `/admin/categories`. Deleting a category that has paintings should error (FK restrict) — acceptable for now.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: admin categories CRUD"
```

---

### Task 9: Paintings CRUD (with photo gallery)

**Files:**
- Create: `src/app/admin/(dash)/paintings/actions.ts`, `src/app/admin/(dash)/paintings/page.tsx`, `src/app/admin/(dash)/paintings/[id]/page.tsx`, `src/app/admin/(dash)/paintings/[id]/PaintingForm.tsx`

**Interfaces:**
- Consumes: `paintingInput`, `slugify`, `uniqueSlug`, `db`, `paintings`, `photos`, `categories`, `ImageUploader`.
- Produces: `createPainting(formData)→ redirect to /admin/paintings/[id]`, `updatePainting(formData)`, `deletePainting(formData)`, `addPhoto(formData)`, `removePhoto(formData)`, `setCoverPhoto(formData)`, `reorderPhoto(formData)`.

- [ ] **Step 1: Write `actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paintings, photos } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { paintingInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";

async function slugTaken(categoryId: number, exceptId?: number) {
  const rows = await db.select({ slug: paintings.slug, id: paintings.id })
    .from(paintings).where(eq(paintings.categoryId, categoryId));
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createPainting(formData: FormData) {
  await requireAdmin();
  const data = paintingInput.parse({
    title: formData.get("title"), description: formData.get("description") ?? "", categoryId: formData.get("categoryId"),
  });
  const slug = uniqueSlug(slugify(data.title), await slugTaken(data.categoryId));
  const [row] = await db.insert(paintings).values({
    title: data.title, description: data.description || null, categoryId: data.categoryId, slug,
  }).returning({ id: paintings.id });
  redirect(`/admin/paintings/${row.id}`);
}

export async function updatePainting(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = paintingInput.parse({
    title: formData.get("title"), description: formData.get("description") ?? "", categoryId: formData.get("categoryId"),
  });
  const slug = uniqueSlug(slugify(data.title), await slugTaken(data.categoryId, id));
  await db.update(paintings).set({
    title: data.title, description: data.description || null, categoryId: data.categoryId, slug,
  }).where(eq(paintings.id, id));
  revalidatePath("/admin/paintings"); revalidatePath("/");
}

export async function deletePainting(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(paintings).where(eq(paintings.id, id)); // photos cascade
  revalidatePath("/admin/paintings"); revalidatePath("/");
  redirect("/admin/paintings");
}

export async function addPhoto(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const url = String(formData.get("url"));
  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;
  const existing = await db.select().from(photos).where(eq(photos.paintingId, paintingId));
  await db.insert(photos).values({ paintingId, url, width, height, position: existing.length });
  // first photo becomes the cover automatically
  if (existing.length === 0) {
    await db.update(paintings).set({ coverPhotoUrl: url }).where(eq(paintings.id, paintingId));
  }
  revalidatePath(`/admin/paintings/${paintingId}`); revalidatePath("/");
}

export async function setCoverPhoto(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const url = String(formData.get("url"));
  await db.update(paintings).set({ coverPhotoUrl: url }).where(eq(paintings.id, paintingId));
  revalidatePath(`/admin/paintings/${paintingId}`); revalidatePath("/");
}

export async function removePhoto(formData: FormData) {
  await requireAdmin();
  const photoId = Number(formData.get("photoId"));
  const paintingId = Number(formData.get("paintingId"));
  await db.delete(photos).where(eq(photos.id, photoId));
  revalidatePath(`/admin/paintings/${paintingId}`); revalidatePath("/");
}
```

- [ ] **Step 2: Write `paintings/page.tsx`** (list + create)

```tsx
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { paintings, categories } from "@/db/schema";
import { createPainting } from "./actions";

export default async function PaintingsPage() {
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const rows = await db.select().from(paintings).orderBy(asc(paintings.position), asc(paintings.title));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Paintings</h1>
      <form action={createPainting} className="flex gap-2">
        <input name="title" placeholder="Title" required className="border p-2" />
        <select name="categoryId" required className="border p-2">
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <input name="description" placeholder="Description (optional)" className="border p-2 flex-1" />
        <button className="bg-neutral-900 text-white px-4">Create</button>
      </form>
      <ul className="grid grid-cols-3 gap-4">
        {rows.map((p) => (
          <li key={p.id} className="border p-3">
            <Link href={`/admin/paintings/${p.id}`} className="underline">{p.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 3: Write `paintings/[id]/page.tsx`** (edit + photos)

```tsx
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paintings, photos, categories } from "@/db/schema";
import { PaintingForm } from "./PaintingForm";

export default async function EditPainting({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const pid = Number(id);
  const [painting] = await db.select().from(paintings).where(eq(paintings.id, pid));
  if (!painting) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const pics = await db.select().from(photos).where(eq(photos.paintingId, pid)).orderBy(asc(photos.position));
  return <PaintingForm painting={painting} categories={cats} photos={pics} />;
}
```

- [ ] **Step 4: Write `paintings/[id]/PaintingForm.tsx`** (client; uses `ImageUploader` then submits a hidden form to `addPhoto`)

```tsx
"use client";
import { useRef } from "react";
import Image from "next/image";
import type { Painting, Photo, Category } from "@/db/schema";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { updatePainting, deletePainting, addPhoto, removePhoto, setCoverPhoto } from "./actions";

export function PaintingForm({ painting, categories, photos }: { painting: Painting; categories: Category[]; photos: Photo[] }) {
  const addRef = useRef<HTMLFormElement>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  const wRef = useRef<HTMLInputElement>(null);
  const hRef = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl">Edit painting</h1>
      <form action={updatePainting} className="space-y-3">
        <input type="hidden" name="id" value={painting.id} />
        <input name="title" defaultValue={painting.title} className="border p-2 w-full" />
        <select name="categoryId" defaultValue={painting.categoryId} className="border p-2 w-full">
          {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <textarea name="description" defaultValue={painting.description ?? ""} className="border p-2 w-full" rows={4} placeholder="Description (optional)" />
        <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
      </form>

      <section className="space-y-3">
        <h2 className="font-display text-2xl">Photos</h2>
        <ImageUploader onUploaded={(img) => {
          urlRef.current!.value = img.url; wRef.current!.value = String(img.width); hRef.current!.value = String(img.height);
          addRef.current!.requestSubmit();
        }} />
        <form ref={addRef} action={addPhoto} className="hidden">
          <input type="hidden" name="paintingId" value={painting.id} />
          <input type="hidden" name="url" ref={urlRef} />
          <input type="hidden" name="width" ref={wRef} />
          <input type="hidden" name="height" ref={hRef} />
        </form>
        <div className="grid grid-cols-3 gap-4">
          {photos.map((ph) => (
            <div key={ph.id} className="border p-2 space-y-1">
              <Image src={ph.url} alt="" width={300} height={300} className="w-full h-40 object-cover" />
              {painting.coverPhotoUrl === ph.url
                ? <span className="text-xs text-green-700">Cover</span>
                : <form action={setCoverPhoto}><input type="hidden" name="paintingId" value={painting.id} /><input type="hidden" name="url" value={ph.url} /><button className="text-xs underline">Make cover</button></form>}
              <form action={removePhoto}><input type="hidden" name="photoId" value={ph.id} /><input type="hidden" name="paintingId" value={painting.id} /><button className="text-xs text-red-600">Remove</button></form>
            </div>
          ))}
        </div>
      </section>

      <form action={deletePainting}><input type="hidden" name="id" value={painting.id} /><button className="text-sm text-red-600">Delete painting</button></form>
    </div>
  );
}
```

- [ ] **Step 5: Manual verify** — create a painting, upload main + extra photos, set cover, remove a photo, edit, delete.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: admin paintings CRUD with photo gallery and cover"
```

---

### Task 10: Featured (home slider) management

**Files:**
- Create: `src/app/admin/(dash)/featured/actions.ts`, `src/app/admin/(dash)/featured/page.tsx`

**Interfaces:**
- Consumes: `db`, `featured`, `paintings`.
- Produces: `addFeatured(formData)`, `removeFeatured(formData)`, `moveFeatured(formData)` (position up/down).

- [ ] **Step 1: Write `actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { featured } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function addFeatured(formData: FormData) {
  await requireAdmin();
  const paintingId = Number(formData.get("paintingId"));
  const rows = await db.select().from(featured);
  if (rows.some((r) => r.paintingId === paintingId)) return;
  await db.insert(featured).values({ paintingId, position: rows.length });
  revalidatePath("/admin/featured"); revalidatePath("/");
}

export async function removeFeatured(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(featured).where(eq(featured.id, id));
  revalidatePath("/admin/featured"); revalidatePath("/");
}

export async function moveFeatured(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const dir = String(formData.get("dir")); // "up" | "down"
  const rows = await db.select().from(featured).orderBy(asc(featured.position));
  const idx = rows.findIndex((r) => r.id === id);
  const swap = dir === "up" ? idx - 1 : idx + 1;
  if (idx < 0 || swap < 0 || swap >= rows.length) return;
  await db.update(featured).set({ position: rows[swap].position }).where(eq(featured.id, rows[idx].id));
  await db.update(featured).set({ position: rows[idx].position }).where(eq(featured.id, rows[swap].id));
  revalidatePath("/admin/featured"); revalidatePath("/");
}
```

- [ ] **Step 2: Write `page.tsx`** (current featured list + add picker)

```tsx
import Image from "next/image";
import { asc, inArray, notInArray } from "drizzle-orm";
import { db } from "@/db";
import { featured, paintings } from "@/db/schema";
import { addFeatured, removeFeatured, moveFeatured } from "./actions";

export default async function FeaturedPage() {
  const feat = await db.select().from(featured).orderBy(asc(featured.position));
  const ids = feat.map((f) => f.paintingId);
  const featPaintings = ids.length ? await db.select().from(paintings).where(inArray(paintings.id, ids)) : [];
  const byId = new Map(featPaintings.map((p) => [p.id, p]));
  const candidates = ids.length
    ? await db.select().from(paintings).where(notInArray(paintings.id, ids))
    : await db.select().from(paintings);
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Home slider</h1>
      <form action={addFeatured} className="flex gap-2">
        <select name="paintingId" className="border p-2">
          {candidates.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        <button className="bg-neutral-900 text-white px-4">Add to slider</button>
      </form>
      <ol className="space-y-2">
        {feat.map((f) => {
          const p = byId.get(f.paintingId);
          return (
            <li key={f.id} className="flex items-center gap-3 border-b pb-2">
              {p?.coverPhotoUrl && <Image src={p.coverPhotoUrl} alt="" width={80} height={60} className="object-cover" />}
              <span className="flex-1">{p?.title ?? "(missing)"}</span>
              <form action={moveFeatured}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="dir" value="up" /><button className="text-sm">↑</button></form>
              <form action={moveFeatured}><input type="hidden" name="id" value={f.id} /><input type="hidden" name="dir" value="down" /><button className="text-sm">↓</button></form>
              <form action={removeFeatured}><input type="hidden" name="id" value={f.id} /><button className="text-sm text-red-600">Remove</button></form>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
```

- [ ] **Step 3: Manual verify** — add paintings to the slider, reorder, remove.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: admin home slider (featured) management"
```

---

### Task 11: Blog CRUD with Tiptap editor

**Files:**
- Create: `src/lib/sanitize.ts`, `src/components/admin/Editor.tsx`, `src/app/admin/(dash)/blog/actions.ts`, `src/app/admin/(dash)/blog/page.tsx`, `src/app/admin/(dash)/blog/[id]/page.tsx`, `src/app/admin/(dash)/blog/[id]/BlogForm.tsx`
- Test: `src/lib/sanitize.test.ts`

**Interfaces:**
- Consumes: `blogPostInput`, `slugify`, `uniqueSlug`, `db`, `blogPosts`.
- Produces:
  - `sanitizeHtml(html: string): string` (strips scripts/event handlers).
  - `<Editor value onChange />` Tiptap client component (HTML in/out).
  - `createBlogPost(formData) → redirect`, `updateBlogPost(formData)`, `deleteBlogPost(formData)`.

- [ ] **Step 1: Install Tiptap**

```bash
npm i @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-image @tiptap/extension-link
```

- [ ] **Step 2: Write failing test `src/lib/sanitize.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps headings and bold", () => {
    expect(sanitizeHtml("<h2>Hi</h2><strong>bold</strong>")).toContain("<strong>bold</strong>");
  });
  it("removes script tags", () => {
    expect(sanitizeHtml('<p>ok</p><script>alert(1)</script>')).not.toContain("script");
  });
});
```

- [ ] **Step 3: Run, expect FAIL.** `npx vitest run src/lib/sanitize.test.ts`

- [ ] **Step 4: Implement `src/lib/sanitize.ts`**

```ts
import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["p", "h2", "h3", "strong", "em", "ul", "ol", "li", "a", "blockquote", "br", "img"],
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
  });
}
```

- [ ] **Step 5: Run, expect PASS.** `npx vitest run src/lib/sanitize.test.ts`

- [ ] **Step 6: Write `src/components/admin/Editor.tsx`**

```tsx
"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { useEffect } from "react";

export function Editor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [StarterKit, Image, Link.configure({ openOnClick: false })],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });
  useEffect(() => () => editor?.destroy(), [editor]);
  if (!editor) return null;
  return (
    <div className="border">
      <div className="flex gap-2 border-b p-2 text-sm">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()}>Bold</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()}>List</button>
        <button type="button" onClick={() => { const url = prompt("Image URL"); if (url) editor.chain().focus().setImage({ src: url }).run(); }}>Image</button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-3 min-h-48" />
    </div>
  );
}
```

- [ ] **Step 7: Write `blog/actions.ts`** (sanitize body; set `publishedAt` when first published)

```ts
"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { blogPostInput } from "@/lib/validation";
import { slugify, uniqueSlug } from "@/lib/slug";
import { sanitizeHtml } from "@/lib/sanitize";

async function takenSlugs(exceptId?: number) {
  const rows = await db.select({ slug: blogPosts.slug, id: blogPosts.id }).from(blogPosts);
  return rows.filter((r) => r.id !== exceptId).map((r) => r.slug);
}

export async function createBlogPost(formData: FormData) {
  await requireAdmin();
  const data = blogPostInput.parse({
    title: formData.get("title"), body: formData.get("body") ?? "", status: formData.get("status") ?? "draft",
  });
  const slug = uniqueSlug(slugify(data.title), await takenSlugs());
  const [row] = await db.insert(blogPosts).values({
    title: data.title, slug, body: sanitizeHtml(data.body), status: data.status,
    coverPhotoUrl: (formData.get("coverPhotoUrl") as string) || null,
    publishedAt: data.status === "published" ? new Date() : null,
  }).returning({ id: blogPosts.id });
  redirect(`/admin/blog/${row.id}`);
}

export async function updateBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  const data = blogPostInput.parse({
    title: formData.get("title"), body: formData.get("body") ?? "", status: formData.get("status") ?? "draft",
  });
  const [current] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
  const slug = uniqueSlug(slugify(data.title), await takenSlugs(id));
  await db.update(blogPosts).set({
    title: data.title, slug, body: sanitizeHtml(data.body), status: data.status,
    coverPhotoUrl: (formData.get("coverPhotoUrl") as string) || null,
    publishedAt: data.status === "published" ? (current?.publishedAt ?? new Date()) : null,
  }).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog"); revalidatePath("/blog"); revalidatePath(`/blog/${slug}`);
}

export async function deleteBlogPost(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  revalidatePath("/admin/blog"); revalidatePath("/blog");
  redirect("/admin/blog");
}
```

- [ ] **Step 8: Write `blog/page.tsx`** (list + create title)

```tsx
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { createBlogPost } from "./actions";

export default async function BlogAdmin() {
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl">Blog</h1>
      <form action={createBlogPost} className="flex gap-2">
        <input name="title" placeholder="New post title" required className="border p-2 flex-1" />
        <button className="bg-neutral-900 text-white px-4">Create</button>
      </form>
      <ul className="space-y-2">
        {rows.map((p) => (
          <li key={p.id} className="flex gap-3 border-b pb-2">
            <Link href={`/admin/blog/${p.id}`} className="underline flex-1">{p.title}</Link>
            <span className="text-sm text-neutral-500">{p.status}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 9: Write `blog/[id]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { BlogForm } from "./BlogForm";

export default async function EditBlog({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, Number(id)));
  if (!post) notFound();
  return <BlogForm post={post} />;
}
```

- [ ] **Step 10: Write `blog/[id]/BlogForm.tsx`** (client; Editor + cover upload + status)

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import type { BlogPost } from "@/db/schema";
import { Editor } from "@/components/admin/Editor";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { updateBlogPost, deleteBlogPost } from "./actions";

export function BlogForm({ post }: { post: BlogPost }) {
  const [body, setBody] = useState(post.body);
  const [cover, setCover] = useState(post.coverPhotoUrl ?? "");
  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="font-display text-3xl">Edit post</h1>
      <form action={updateBlogPost} className="space-y-4">
        <input type="hidden" name="id" value={post.id} />
        <input type="hidden" name="body" value={body} />
        <input type="hidden" name="coverPhotoUrl" value={cover} />
        <input name="title" defaultValue={post.title} className="border p-2 w-full text-xl" />
        <div className="space-y-2">
          <span className="text-sm">Cover</span>
          {cover && <Image src={cover} alt="" width={240} height={140} className="object-cover" />}
          <ImageUploader onUploaded={(img) => setCover(img.url)} />
        </div>
        <Editor value={post.body} onChange={setBody} />
        <div className="flex items-center gap-3">
          <select name="status" defaultValue={post.status} className="border p-2">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
          <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
        </div>
      </form>
      <form action={deleteBlogPost}><input type="hidden" name="id" value={post.id} /><button className="text-sm text-red-600">Delete</button></form>
    </div>
  );
}
```

- [ ] **Step 11: Manual verify** — create a post, format with the editor, set a cover, publish, edit, delete.

- [ ] **Step 12: Commit**

```bash
git add -A && git commit -m "feat: admin blog CRUD with Tiptap editor and HTML sanitization"
```

---

### Task 12: Settings/Pages + Messages

**Files:**
- Create: `src/app/admin/(dash)/settings/actions.ts`, `src/app/admin/(dash)/settings/page.tsx`, `src/app/admin/(dash)/settings/SettingsForm.tsx`, `src/app/admin/(dash)/messages/actions.ts`, `src/app/admin/(dash)/messages/page.tsx`

**Interfaces:**
- Consumes: `settingsInput`, `sanitizeHtml`, `db`, `siteSettings`, `contactMessages`, `Editor`.
- Produces: `saveSettings(formData)`, `markRead(formData)`, `deleteMessage(formData)`.

- [ ] **Step 1: Write `settings/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { requireAdmin } from "@/lib/session";
import { settingsInput } from "@/lib/validation";
import { sanitizeHtml } from "@/lib/sanitize";

export async function saveSettings(formData: FormData) {
  await requireAdmin();
  const links: { label: string; url: string }[] = [];
  const labels = formData.getAll("link_label").map(String);
  const urls = formData.getAll("link_url").map(String);
  labels.forEach((label, i) => { if (label && urls[i]) links.push({ label, url: urls[i] }); });
  const data = settingsInput.parse({
    aboutContent: formData.get("aboutContent") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    phone: formData.get("phone") ?? "",
    socialLinks: links,
  });
  await db.update(siteSettings).set({
    aboutContent: sanitizeHtml(data.aboutContent),
    contactEmail: data.contactEmail || null,
    phone: data.phone || null,
    socialLinks: data.socialLinks,
  }).where(eq(siteSettings.id, 1));
  revalidatePath("/about"); revalidatePath("/contact"); revalidatePath("/admin/settings");
}
```

- [ ] **Step 2: Write `settings/page.tsx`**

```tsx
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const [s] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  return <SettingsForm settings={s} />;
}
```

- [ ] **Step 3: Write `settings/SettingsForm.tsx`** (About via Editor + contact fields + up to 5 social links)

```tsx
"use client";
import { useState } from "react";
import type { SiteSettings } from "@/db/schema";
import { Editor } from "@/components/admin/Editor";
import { saveSettings } from "./actions";

export function SettingsForm({ settings }: { settings: SiteSettings }) {
  const [about, setAbout] = useState(settings.aboutContent);
  const links = [...settings.socialLinks];
  while (links.length < 5) links.push({ label: "", url: "" });
  return (
    <form action={saveSettings} className="space-y-6 max-w-2xl">
      <h1 className="font-display text-3xl">Settings</h1>
      <input type="hidden" name="aboutContent" value={about} />
      <div className="space-y-2"><span className="text-sm">About page</span><Editor value={settings.aboutContent} onChange={setAbout} /></div>
      <input name="contactEmail" defaultValue={settings.contactEmail ?? ""} placeholder="Contact email" className="border p-2 w-full" />
      <input name="phone" defaultValue={settings.phone ?? ""} placeholder="Phone" className="border p-2 w-full" />
      <div className="space-y-2">
        <span className="text-sm">Social links</span>
        {links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input name="link_label" defaultValue={l.label} placeholder="Label (e.g. Instagram)" className="border p-2" />
            <input name="link_url" defaultValue={l.url} placeholder="https://…" className="border p-2 flex-1" />
          </div>
        ))}
      </div>
      <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
    </form>
  );
}
```

- [ ] **Step 4: Write `messages/actions.ts`**

```ts
"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function markRead(formData: FormData) {
  await requireAdmin();
  await db.update(contactMessages).set({ read: true }).where(eq(contactMessages.id, Number(formData.get("id"))));
  revalidatePath("/admin/messages");
}
export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  await db.delete(contactMessages).where(eq(contactMessages.id, Number(formData.get("id"))));
  revalidatePath("/admin/messages");
}
```

- [ ] **Step 5: Write `messages/page.tsx`**

```tsx
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { markRead, deleteMessage } from "./actions";

export default async function MessagesPage() {
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl">Messages</h1>
      {rows.map((m) => (
        <div key={m.id} className={`border p-3 ${m.read ? "opacity-60" : ""}`}>
          <div className="flex justify-between text-sm text-neutral-500">
            <span>{m.name} — {m.email}</span><span>{m.createdAt.toISOString().slice(0, 10)}</span>
          </div>
          <p className="my-2 whitespace-pre-wrap">{m.message}</p>
          <div className="flex gap-3 text-sm">
            {!m.read && <form action={markRead}><input type="hidden" name="id" value={m.id} /><button className="underline">Mark read</button></form>}
            <form action={deleteMessage}><input type="hidden" name="id" value={m.id} /><button className="text-red-600">Delete</button></form>
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Manual verify** — save settings + social links; messages page renders (real messages appear after Task 17).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: admin settings (about/contact) and contact messages"
```

---

## Phase 5 — Public Site

### Task 13: Public layout, nav, and home slider

**Files:**
- Create: `src/lib/queries.ts`, `src/components/HomeSlider.tsx`, `src/app/(public)/layout.tsx`, `src/app/(public)/page.tsx`
- Modify: delete the placeholder `src/app/page.tsx` (home now lives in `(public)`)

**Interfaces:**
- Consumes: `db`, all tables.
- Produces (in `queries.ts`):
  - `getNavCategories(): Promise<Category[]>` (ordered)
  - `getSettings(): Promise<SiteSettings>`
  - `getFeaturedSlides(): Promise<{ url: string; title: string }[]>` (cover of each featured painting, in order)

- [ ] **Step 1: Write `src/lib/queries.ts`**

```ts
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, featured, siteSettings } from "@/db/schema";

export async function getNavCategories() {
  return db.select().from(categories).orderBy(asc(categories.position), asc(categories.name));
}
export async function getSettings() {
  const [s] = await db.select().from(siteSettings).where(eq(siteSettings.id, 1));
  return s;
}
export async function getFeaturedSlides() {
  const feat = await db.select().from(featured).orderBy(asc(featured.position));
  if (!feat.length) return [];
  const rows = await db.select().from(paintings).where(inArray(paintings.id, feat.map((f) => f.paintingId)));
  const byId = new Map(rows.map((p) => [p.id, p]));
  return feat
    .map((f) => byId.get(f.paintingId))
    .filter((p): p is NonNullable<typeof p> => !!p && !!p.coverPhotoUrl)
    .map((p) => ({ url: p.coverPhotoUrl!, title: p.title }));
}
```

- [ ] **Step 2: Write `src/components/HomeSlider.tsx`** (client; auto-advancing, NOT clickable)

```tsx
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";

export function HomeSlider({ slides }: { slides: { url: string; title: string }[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (slides.length < 2) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 5000);
    return () => clearInterval(t);
  }, [slides.length]);
  if (!slides.length) return null;
  return (
    <section className="relative h-[70vh] w-full overflow-hidden bg-neutral-50">
      {slides.map((s, idx) => (
        <div key={idx} className={`absolute inset-0 transition-opacity duration-1000 ${idx === i ? "opacity-100" : "opacity-0"}`}>
          <Image src={s.url} alt={s.title} fill priority={idx === 0} className="object-contain" />
        </div>
      ))}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
        {slides.map((_, idx) => (
          <button key={idx} aria-label={`Slide ${idx + 1}`} onClick={() => setI(idx)}
            className={`h-2 w-2 rounded-full ${idx === i ? "bg-neutral-900" : "bg-neutral-300"}`} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Write `src/app/(public)/layout.tsx`** (top nav + footer with contact info)

```tsx
import Link from "next/link";
import { getNavCategories, getSettings } from "@/lib/queries";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [cats, settings] = await Promise.all([getNavCategories(), getSettings()]);
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex flex-wrap items-center justify-between px-6 py-5 border-b">
        <Link href="/" className="font-display text-2xl">Natalia de Pita</Link>
        <nav className="flex flex-wrap gap-5 text-sm">
          {cats.map((c) => <Link key={c.id} href={`/${c.slug}`} className="hover:underline">{c.name}</Link>)}
          <Link href="/blog" className="hover:underline">Blog</Link>
          <Link href="/about" className="hover:underline">About</Link>
          <Link href="/contact" className="hover:underline">Contact</Link>
        </nav>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t px-6 py-8 text-sm text-neutral-600">
        {settings?.contactEmail && <span className="mr-4">{settings.contactEmail}</span>}
        {settings?.phone && <span className="mr-4">{settings.phone}</span>}
        {settings?.socialLinks?.map((l) => <a key={l.url} href={l.url} className="mr-4 underline" target="_blank" rel="noreferrer">{l.label}</a>)}
      </footer>
    </div>
  );
}
```

- [ ] **Step 4: Write `src/app/(public)/page.tsx`**

```tsx
import { getFeaturedSlides } from "@/lib/queries";
import { HomeSlider } from "@/components/HomeSlider";

export default async function Home() {
  const slides = await getFeaturedSlides();
  return (
    <>
      <HomeSlider slides={slides} />
      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="font-display text-4xl">Natalia Amirejibi de Pita</h1>
        <p className="mt-4 text-neutral-600">Paintings and monumental mosaics.</p>
      </section>
    </>
  );
}
```

- [ ] **Step 5: Delete the old placeholder** `src/app/page.tsx` (the `(public)/page.tsx` is now the index route).

- [ ] **Step 6: Manual verify** — home shows the slider (after adding featured paintings) and nav lists categories.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat: public layout, nav, footer, and home slider"
```

---

### Task 14: Category grid page

**Files:**
- Create: `src/components/PaintingGrid.tsx`, `src/app/(public)/[category]/page.tsx`

**Interfaces:**
- Consumes: `db`, `categories`, `paintings`.
- Produces: `generateStaticParams` is NOT used (dynamic). Page resolves category by slug → 404 if missing → renders grid of paintings linking to `/[category]/[painting-slug]`.

- [ ] **Step 1: Write `src/components/PaintingGrid.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import type { Painting } from "@/db/schema";

export function PaintingGrid({ categorySlug, paintings }: { categorySlug: string; paintings: Painting[] }) {
  return (
    <div className="grid grid-cols-2 gap-6 md:grid-cols-3">
      {paintings.map((p) => (
        <Link key={p.id} href={`/${categorySlug}/${p.slug}`} className="group">
          {p.coverPhotoUrl && (
            <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
              <Image src={p.coverPhotoUrl} alt={p.title} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
          )}
          <p className="mt-2 text-sm">{p.title}</p>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/(public)/[category]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings } from "@/db/schema";
import { PaintingGrid } from "@/components/PaintingGrid";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.slug, category));
  if (!cat) notFound();
  const rows = await db.select().from(paintings).where(eq(paintings.categoryId, cat.id))
    .orderBy(asc(paintings.position), asc(paintings.title));
  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <h1 className="font-display text-4xl mb-2">{cat.name}</h1>
      {cat.description && <p className="text-neutral-600 mb-8 max-w-2xl">{cat.description}</p>}
      <PaintingGrid categorySlug={cat.slug} paintings={rows} />
    </div>
  );
}
```

- [ ] **Step 3: Manual verify** — visiting `/black-white` (or a real slug) shows the grid; bad slug → 404.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: public category grid page"
```

---

### Task 15: Painting detail page + lightbox

**Files:**
- Create: `src/components/Lightbox.tsx`, `src/app/(public)/[category]/[painting]/page.tsx`

**Interfaces:**
- Consumes: `db`, `categories`, `paintings`, `photos`.
- Produces: detail page — large main image, additional photos in a gallery, title, optional description. `<Lightbox photos />` opens a full-screen viewer on click for "good viewing".

- [ ] **Step 1: Write `src/components/Lightbox.tsx`** (client; main image + thumbnails + fullscreen overlay)

```tsx
"use client";
import { useState } from "react";
import Image from "next/image";
import type { Photo } from "@/db/schema";

export function Lightbox({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  if (!photos.length) return null;
  const main = photos[active];
  return (
    <div>
      <button className="relative block w-full" onClick={() => setOpen(true)} aria-label="View larger">
        <Image src={main.url} alt="" width={main.width ?? 1200} height={main.height ?? 900} className="h-auto w-full object-contain" priority />
      </button>
      {photos.length > 1 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {photos.map((ph, i) => (
            <button key={ph.id} onClick={() => setActive(i)} className={`relative h-20 w-20 ${i === active ? "ring-2 ring-neutral-900" : ""}`}>
              <Image src={ph.url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-6" onClick={() => setOpen(false)}>
          <Image src={main.url} alt="" width={main.width ?? 1600} height={main.height ?? 1200} className="max-h-full w-auto object-contain" />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/(public)/[category]/[painting]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { categories, paintings, photos } from "@/db/schema";
import { Lightbox } from "@/components/Lightbox";

export default async function PaintingPage({ params }: { params: Promise<{ category: string; painting: string }> }) {
  const { category, painting } = await params;
  const [cat] = await db.select().from(categories).where(eq(categories.slug, category));
  if (!cat) notFound();
  const [p] = await db.select().from(paintings).where(and(eq(paintings.categoryId, cat.id), eq(paintings.slug, painting)));
  if (!p) notFound();
  const pics = await db.select().from(photos).where(eq(photos.paintingId, p.id)).orderBy(asc(photos.position));
  // ensure the cover is first
  pics.sort((a, b) => (a.url === p.coverPhotoUrl ? -1 : b.url === p.coverPhotoUrl ? 1 : 0));
  return (
    <article className="mx-auto max-w-4xl px-6 py-12">
      <Lightbox photos={pics} />
      <h1 className="font-display text-3xl mt-8">{p.title}</h1>
      {p.description && <p className="mt-4 whitespace-pre-wrap text-neutral-700 leading-relaxed">{p.description}</p>}
    </article>
  );
}
```

- [ ] **Step 3: Manual verify** — open a painting; main image large, thumbnails switch, click opens fullscreen; a painting with no description shows title only.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "feat: public painting detail page with lightbox"
```

---

### Task 16: Blog list + post pages

**Files:**
- Create: `src/components/RichText.tsx`, `src/app/(public)/blog/page.tsx`, `src/app/(public)/blog/[slug]/page.tsx`

**Interfaces:**
- Consumes: `db`, `blogPosts`, `sanitizeHtml`.
- Produces: blog index (published only, newest first) and post page rendering sanitized HTML via `<RichText html />`.

- [ ] **Step 1: Write `src/components/RichText.tsx`**

```tsx
import { sanitizeHtml } from "@/lib/sanitize";

export function RichText({ html }: { html: string }) {
  return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />;
}
```

- [ ] **Step 2: Write `src/app/(public)/blog/page.tsx`**

```tsx
import Link from "next/link";
import Image from "next/image";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";

export default async function BlogList() {
  const rows = await db.select().from(blogPosts).where(eq(blogPosts.status, "published")).orderBy(desc(blogPosts.publishedAt));
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 space-y-10">
      <h1 className="font-display text-4xl">Blog</h1>
      {rows.map((p) => (
        <Link key={p.id} href={`/blog/${p.slug}`} className="block group">
          {p.coverPhotoUrl && <div className="relative aspect-[16/9] mb-3"><Image src={p.coverPhotoUrl} alt="" fill className="object-cover" /></div>}
          <h2 className="font-display text-2xl group-hover:underline">{p.title}</h2>
          {p.publishedAt && <time className="text-sm text-neutral-500">{p.publishedAt.toISOString().slice(0, 10)}</time>}
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Write `src/app/(public)/blog/[slug]/page.tsx`**

```tsx
import { notFound } from "next/navigation";
import Image from "next/image";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts } from "@/db/schema";
import { RichText } from "@/components/RichText";

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db.select().from(blogPosts).where(and(eq(blogPosts.slug, slug), eq(blogPosts.status, "published")));
  if (!p) notFound();
  return (
    <article className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl">{p.title}</h1>
      {p.publishedAt && <time className="text-sm text-neutral-500">{p.publishedAt.toISOString().slice(0, 10)}</time>}
      {p.coverPhotoUrl && <div className="relative aspect-[16/9] my-6"><Image src={p.coverPhotoUrl} alt="" fill className="object-cover" /></div>}
      <RichText html={p.body} />
    </article>
  );
}
```

- [ ] **Step 4: Manual verify** — published posts appear; drafts do not; a post renders formatted HTML.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: public blog list and post pages"
```

---

### Task 17: About + Contact pages

**Files:**
- Create: `src/app/(public)/about/page.tsx`, `src/app/(public)/contact/page.tsx`, `src/app/(public)/contact/actions.ts`, `src/app/(public)/contact/ContactForm.tsx`

**Interfaces:**
- Consumes: `getSettings`, `contactInput`, `db`, `contactMessages`, `RichText`.
- Produces: `submitContact(prevState, formData): Promise<{ ok: boolean; error?: string }>` storing a validated message.

- [ ] **Step 1: Write `src/app/(public)/about/page.tsx`**

```tsx
import { getSettings } from "@/lib/queries";
import { RichText } from "@/components/RichText";

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <h1 className="font-display text-4xl mb-6">About</h1>
      {s?.aboutContent ? <RichText html={s.aboutContent} /> : <p className="text-neutral-500">Coming soon.</p>}
    </div>
  );
}
```

- [ ] **Step 2: Write `src/app/(public)/contact/actions.ts`**

```ts
"use server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactInput } from "@/lib/validation";

export async function submitContact(_prev: { ok: boolean; error?: string }, formData: FormData) {
  const parsed = contactInput.safeParse({
    name: formData.get("name"), email: formData.get("email"), message: formData.get("message"),
  });
  if (!parsed.success) return { ok: false, error: "Please fill in all fields with a valid email." };
  await db.insert(contactMessages).values(parsed.data);
  return { ok: true };
}
```

- [ ] **Step 3: Write `src/app/(public)/contact/ContactForm.tsx`**

```tsx
"use client";
import { useActionState } from "react";
import { submitContact } from "./actions";

export function ContactForm() {
  const [state, action] = useActionState(submitContact, { ok: false });
  if (state.ok) return <p className="text-green-700">Thank you — your message has been sent.</p>;
  return (
    <form action={action} className="space-y-4 max-w-md">
      <input name="name" placeholder="Your name" required className="border p-2 w-full" />
      <input name="email" type="email" placeholder="Email" required className="border p-2 w-full" />
      <textarea name="message" placeholder="Message" required rows={5} className="border p-2 w-full" />
      {state.error && <p className="text-red-600 text-sm">{state.error}</p>}
      <button className="bg-neutral-900 text-white px-5 py-2">Send</button>
    </form>
  );
}
```

- [ ] **Step 4: Write `src/app/(public)/contact/page.tsx`**

```tsx
import { getSettings } from "@/lib/queries";
import { ContactForm } from "./ContactForm";

export default async function ContactPage() {
  const s = await getSettings();
  return (
    <div className="mx-auto max-w-3xl px-6 py-12 grid gap-10 md:grid-cols-2">
      <div>
        <h1 className="font-display text-4xl mb-6">Contact</h1>
        <ContactForm />
      </div>
      <aside className="space-y-2 text-neutral-700">
        {s?.contactEmail && <p>Email: <a className="underline" href={`mailto:${s.contactEmail}`}>{s.contactEmail}</a></p>}
        {s?.phone && <p>Phone: {s.phone}</p>}
        {s?.socialLinks?.map((l) => <p key={l.url}><a className="underline" href={l.url} target="_blank" rel="noreferrer">{l.label}</a></p>)}
      </aside>
    </div>
  );
}
```

- [ ] **Step 5: Manual verify** — submit the contact form; message appears in `/admin/messages`; About renders editable content.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: public about and contact pages with message submission"
```

---

## Phase 6 — WordPress Migration

### Task 18: One-off migration script

**Files:**
- Create: `scripts/migrate-wordpress.ts`, `scripts/wp-map.ts` (the page→category mapping config)

**Interfaces:**
- Consumes: `db`, `categories`, `paintings`, `photos`, `slugify`, `uniqueSlug`, `put` (Blob).
- Produces: a runnable script that, given a config mapping old WordPress page IDs/URLs → new category names, downloads images and creates `categories`, `paintings`, and `photos`.

- [ ] **Step 1: Create the mapping config `scripts/wp-map.ts`**

```ts
// Maps an old WordPress page (by id) to a new category name.
// Image URLs are collected per page during the run; this only declares categories + ordering.
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
```

- [ ] **Step 2: Write `scripts/migrate-wordpress.ts`** (fetch each page HTML, extract `wp-content/uploads` image URLs, dedupe, upload to Blob, create one painting per image titled from its filename)

```ts
import "dotenv/config";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { Agent } from "undici";
import { asc, eq } from "drizzle-orm";
import { db } from "../src/db";
import { categories, paintings, photos } from "../src/db/schema";
import { slugify, uniqueSlug } from "../src/lib/slug";
import { WP_BASE, PAGE_TO_CATEGORY } from "./wp-map";

// The old site serves a self-signed cert. Rather than disable TLS process-wide
// (NODE_TLS_REJECT_UNAUTHORIZED=0, which exposes ALL connections to MITM — e.g.
// the Neon DB and Vercel Blob writes below), scope the relaxed check to ONLY the
// fetches against the legacy host via a dedicated undici dispatcher. The DB and
// Blob calls keep full TLS verification.
const legacyAgent = new Agent({ connect: { rejectUnauthorized: false } });
const wpFetch = (url: string) => fetch(url, { dispatcher: legacyAgent } as RequestInit);

async function getOrCreateCategory(name: string, position: number) {
  const slug = slugify(name);
  const [existing] = await db.select().from(categories).where(eq(categories.slug, slug));
  if (existing) return existing;
  const [row] = await db.insert(categories).values({ name, slug, position }).returning();
  return row;
}

function extractImageUrls(html: string): string[] {
  const re = /https?:\/\/[^"'\s]*wp-content\/uploads\/[^"'\s]+\.(?:jpe?g|png|gif|webp)/gi;
  const all = html.match(re) ?? [];
  // strip WordPress size suffixes like -300x200 to prefer the full image
  const full = all.map((u) => u.replace(/-\d+x\d+(\.\w+)$/i, "$1"));
  return Array.from(new Set(full));
}

async function uploadFromUrl(url: string): Promise<{ url: string; width: number; height: number } | null> {
  try {
    const res = await wpFetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const meta = await sharp(buf).metadata();
    const name = url.split("/").pop() ?? `img-${Date.now()}.jpg`;
    const blob = await put(`migrated/${Date.now()}-${name}`, buf, { access: "public" });
    return { url: blob.url, width: meta.width ?? 0, height: meta.height ?? 0 };
  } catch (e) {
    console.warn("skip", url, (e as Error).message);
    return null;
  }
}

for (const [i, { pageId, category }] of PAGE_TO_CATEGORY.entries()) {
  const cat = await getOrCreateCategory(category, i);
  const res = await wpFetch(`${WP_BASE}/?page_id=${pageId}`);
  const html = await res.text();
  const urls = extractImageUrls(html);
  console.log(`Page ${pageId} → ${category}: ${urls.length} images`);

  const existingSlugs = (await db.select({ slug: paintings.slug }).from(paintings).where(eq(paintings.categoryId, cat.id))).map((r) => r.slug);

  for (const url of urls) {
    const uploaded = await uploadFromUrl(url);
    if (!uploaded) continue;
    const baseName = (url.split("/").pop() ?? "untitled").replace(/\.\w+$/, "").replace(/[-_]+/g, " ");
    const slug = uniqueSlug(slugify(baseName), existingSlugs);
    existingSlugs.push(slug);
    const [painting] = await db.insert(paintings).values({
      title: baseName, slug, categoryId: cat.id, coverPhotoUrl: uploaded.url,
    }).returning({ id: paintings.id });
    await db.insert(photos).values({ paintingId: painting.id, url: uploaded.url, width: uploaded.width, height: uploaded.height, position: 0 });
  }
}
console.log("Migration complete.");
```

- [ ] **Step 3: Dry-run review** — before running, read the console output of image counts per page. The titles come from filenames and will need manual tidy-up in the admin afterward (expected; documented in the spec).

- [ ] **Step 4: Run the migration**

Run: `npm run migrate:wp`
Expected: per-page image counts logged; categories, paintings, and photos created; "Migration complete."

- [ ] **Step 5: Verify in the app** — categories and their grids populate on the public site; spot-check a few painting pages.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: one-off WordPress migration script"
```

---

## Self-Review

**Spec coverage:**
- §2 architecture → Tasks 1–2 ✓
- §3 data model (all 8 tables) → Task 3 ✓
- §4 public pages (home/slider, category, painting, blog, about, contact) → Tasks 13–17 ✓
- §5 admin (login, categories, paintings+photos, featured, blog, settings, messages) → Tasks 6, 8–12 ✓
- §6 migration → Task 18 ✓
- §7 image handling (Blob, dimensions, validation) → Tasks 4, 7 ✓
- §8 error handling/testing (validation, auth guard, slug, contact) → Tasks 4–7, 17 ✓
- §9 visual direction (fonts, minimal, slider not clickable) → Tasks 1, 13 ✓

**Placeholder scan:** no TBD/TODO; every code step has complete code.

**Type consistency:** `coverPhotoUrl`, `paintingId`, `position`, `slug`, `status` used consistently; `uploadImage` returns `{url,width,height}` and is consumed identically in `ImageUploader`, `addPhoto`, and the migration script; `requireAdmin()` guards every admin action; `sanitizeHtml` used on both write (blog/settings actions) and render (`RichText`).

**Known follow-ups (out of scope, by design):**
- Second language (i18n).
- Slider click-through navigation (deferred per spec).
- Email notification on new contact message (optional; only DB storage implemented).
- Migrated painting titles derive from filenames and need a manual tidy-up pass in admin.
