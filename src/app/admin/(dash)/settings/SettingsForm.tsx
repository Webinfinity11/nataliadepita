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
      <div className="space-y-2">
        <span className="text-sm">About page</span>
        <Editor value={settings.aboutContent} onChange={setAbout} />
      </div>
      <input
        name="contactEmail"
        defaultValue={settings.contactEmail ?? ""}
        placeholder="Contact email"
        className="border p-2 w-full"
      />
      <input
        name="phone"
        defaultValue={settings.phone ?? ""}
        placeholder="Phone"
        className="border p-2 w-full"
      />
      <div className="space-y-2">
        <span className="text-sm">Social links</span>
        {links.map((l, i) => (
          <div key={i} className="flex gap-2">
            <input
              name="link_label"
              defaultValue={l.label}
              placeholder="Label (e.g. Instagram)"
              className="border p-2"
            />
            <input
              name="link_url"
              defaultValue={l.url}
              placeholder="https://…"
              className="border p-2 flex-1"
            />
          </div>
        ))}
      </div>
      <button className="bg-neutral-900 text-white px-4 py-2">Save</button>
    </form>
  );
}
