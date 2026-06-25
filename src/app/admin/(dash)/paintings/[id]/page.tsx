import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { paintings, photos, categories } from "@/db/schema";
import { PaintingForm } from "./PaintingForm";

export default async function EditPainting({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const pid = Number(id);
  const [painting] = await db
    .select()
    .from(paintings)
    .where(eq(paintings.id, pid));
  if (!painting) notFound();
  const cats = await db.select().from(categories).orderBy(asc(categories.name));
  const pics = await db
    .select()
    .from(photos)
    .where(eq(photos.paintingId, pid))
    .orderBy(asc(photos.position));
  return <PaintingForm painting={painting} categories={cats} photos={pics} />;
}
