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

export const featured = pgTable("featured", {
  id: serial("id").primaryKey(),
  paintingId: integer("painting_id")
    .notNull()
    .unique()
    .references(() => paintings.id, { onDelete: "cascade" }),
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

export type Category = typeof categories.$inferSelect;
export type Painting = typeof paintings.$inferSelect;
export type Photo = typeof photos.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type SiteSettings = typeof siteSettings.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
