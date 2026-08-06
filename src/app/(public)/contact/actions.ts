"use server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactInput } from "@/lib/validation";
import { notifyContact } from "@/lib/mail";

export async function submitContact(
  _prev: { ok: boolean; error?: string },
  formData: FormData,
) {
  const parsed = contactInput.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });
  if (!parsed.success)
    return { ok: false, error: "Please fill in all fields with a valid email." };
  // Stored first: the database is the record, the email only the doorbell. A
  // provider that is down or unconfigured must not lose a visitor's enquiry or
  // show them an error for something they cannot do anything about.
  await db.insert(contactMessages).values(parsed.data);
  try {
    await notifyContact(parsed.data);
  } catch (e) {
    console.error("Contact notification threw:", e);
  }
  return { ok: true };
}
