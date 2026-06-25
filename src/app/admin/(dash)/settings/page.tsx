import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings, type SiteSettings } from "@/db/schema";
import { SettingsForm } from "./SettingsForm";

const EMPTY: SiteSettings = {
  id: 1,
  aboutContent: "",
  contactEmail: null,
  phone: null,
  socialLinks: [],
};

export default async function SettingsPage() {
  const [s] = await db
    .select()
    .from(siteSettings)
    .where(eq(siteSettings.id, 1));
  return <SettingsForm settings={s ?? EMPTY} />;
}
