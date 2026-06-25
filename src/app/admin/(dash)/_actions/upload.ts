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
