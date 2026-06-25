"use server";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { contactInput } from "@/lib/validation";

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
  await db.insert(contactMessages).values(parsed.data);
  return { ok: true };
}
