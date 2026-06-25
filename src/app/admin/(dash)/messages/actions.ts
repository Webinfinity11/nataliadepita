"use server";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { requireAdmin } from "@/lib/session";

export async function markRead(formData: FormData) {
  await requireAdmin();
  await db
    .update(contactMessages)
    .set({ read: true })
    .where(eq(contactMessages.id, Number(formData.get("id"))));
  revalidatePath("/admin/messages");
}

export async function deleteMessage(formData: FormData) {
  await requireAdmin();
  await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, Number(formData.get("id"))));
  revalidatePath("/admin/messages");
}
