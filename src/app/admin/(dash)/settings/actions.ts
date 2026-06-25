"use server";
import { revalidatePath } from "next/cache";
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
  labels.forEach((label, i) => {
    if (label && urls[i]) links.push({ label, url: urls[i] });
  });
  const data = settingsInput.parse({
    aboutContent: formData.get("aboutContent") ?? "",
    contactEmail: formData.get("contactEmail") ?? "",
    phone: formData.get("phone") ?? "",
    socialLinks: links,
  });
  const values = {
    aboutContent: sanitizeHtml(data.aboutContent),
    contactEmail: data.contactEmail || null,
    phone: data.phone || null,
    socialLinks: data.socialLinks,
  };
  // Upsert the single settings row so this works even before any manual seed.
  await db
    .insert(siteSettings)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: siteSettings.id, set: values });
  revalidatePath("/about");
  revalidatePath("/contact");
  revalidatePath("/admin/settings");
}
