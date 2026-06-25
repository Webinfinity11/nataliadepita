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
  socialLinks: z
    .array(z.object({ label: z.string().min(1), url: z.string().url() }))
    .default([]),
});
