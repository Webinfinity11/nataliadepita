import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  timestamp,
  jsonb,
  uniqueIndex,
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

// A category can be broken into named parts — a monumental commission is one
// project told in stages, not a flat wall of pictures. A category with no
// sections keeps behaving exactly as before.
export const projectSections = pgTable("project_sections", {
  id: serial("id").primaryKey(),
  categoryId: integer("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  // The facts that sit under the heading — place, years, medium, size. Kept
  // apart from the prose so they can be set in smaller type.
  subtitle: text("subtitle"),
  // Longer prose that introduces the section — the project description sits
  // here, under a section carrying no works of its own.
  body: text("body"),
  // A "project" opens a commission and carries its own display heading; a
  // "group" is a quiet label for one part of the project above it. Both run
  // the full width — the page reads as one column, top to bottom.
  style: text("style", { enum: ["project", "group"] })
    .notNull()
    .default("project"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const paintings = pgTable(
  "paintings",
  {
    id: serial("id").primaryKey(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    // Which part of the category this work belongs to. Unassigned works still
    // show, gathered after the sections.
    sectionId: integer("section_id").references(() => projectSections.id, {
      onDelete: "set null",
    }),
    coverPhotoUrl: text("cover_photo_url"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [uniqueIndex("paintings_cat_slug").on(t.categoryId, t.slug)],
);

export const photos = pgTable("photos", {
  id: serial("id").primaryKey(),
  paintingId: integer("painting_id")
    .notNull()
    .references(() => paintings.id, { onDelete: "cascade" }),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Videos attached to a single work — the artist pastes one link and the
// provider is worked out from the URL (see lib/video.ts). Separate from the
// site-wide `videos` table so the Media page stays curated by hand.
export const paintingVideos = pgTable("painting_videos", {
  id: serial("id").primaryKey(),
  paintingId: integer("painting_id")
    .notNull()
    .references(() => paintings.id, { onDelete: "cascade" }),
  // Either a provider link (YouTube/Vimeo/Facebook) or, for an uploaded file,
  // the Blob URL of the video itself.
  url: text("url").notNull(),
  title: text("title"),
  // Still frame grabbed from the first moment of an uploaded video. Stands in
  // as the work's cover when it has no photographs of its own.
  posterUrl: text("poster_url"),
  posterWidth: integer("poster_width"),
  posterHeight: integer("poster_height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const featured = pgTable("featured", {
  id: serial("id").primaryKey(),
  // A slide is either a directly-uploaded image (imageUrl) or, for legacy
  // rows, linked to a painting. imageUrl is the source of truth for display.
  paintingId: integer("painting_id").references(() => paintings.id, {
    onDelete: "cascade",
  }),
  imageUrl: text("image_url"),
  title: text("title"),
  width: integer("width"),
  height: integer("height"),
  position: integer("position").notNull().default(0),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  slug: text("slug").notNull().unique(),
  coverPhotoUrl: text("cover_photo_url"),
  body: text("body").notNull().default(""),
  status: text("status", { enum: ["draft", "published"] })
    .notNull()
    .default("draft"),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const siteSettings = pgTable("site_settings", {
  id: integer("id").primaryKey().default(1),
  aboutContent: text("about_content").notNull().default(""),
  contactEmail: text("contact_email"),
  phone: text("phone"),
  socialLinks: jsonb("social_links")
    .$type<{ label: string; url: string }[]>()
    .notNull()
    .default([]),
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

// Media → Photogallery: standalone uploaded photos (not tied to a painting).
export const galleryPhotos = pgTable("gallery_photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Media → Press: articles written about the artist, wherever they appeared.
export const pressArticles = pgTable("press_articles", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  publication: text("publication"),
  url: text("url").notNull(),
  publishedOn: text("published_on"),
  // Optional picture that runs beside the headline on the public page. Without
  // one the article falls back to a plain row, so older entries need no edit.
  imageUrl: text("image_url"),
  imageWidth: integer("image_width"),
  imageHeight: integer("image_height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Cuttings and photographs that go with the press coverage.
export const pressPhotos = pgTable("press_photos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  width: integer("width"),
  height: integer("height"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Media → Videos: embedded YouTube/Vimeo/Facebook links.
export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  url: text("url").notNull(),
  title: text("title"),
  position: integer("position").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categories.$inferSelect;
export type ProjectSection = typeof projectSections.$inferSelect;
export type Painting = typeof paintings.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type PaintingVideo = typeof paintingVideos.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type GalleryPhoto = typeof galleryPhotos.$inferSelect;
export type PressArticle = typeof pressArticles.$inferSelect;
export type PressPhoto = typeof pressPhotos.$inferSelect;
export type Video = typeof videos.$inferSelect;
