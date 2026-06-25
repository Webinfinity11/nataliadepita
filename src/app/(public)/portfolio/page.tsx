import { getAllWorks } from "@/lib/queries";
import PortfolioGallery from "@/components/PortfolioGallery";

export default async function PortfolioPage() {
  const works = await getAllWorks();
  // Distinct category names, preserving the order works arrive in (nav order).
  const categories = Array.from(new Set(works.map((w) => w.categoryName)));
  return <PortfolioGallery works={works} categories={categories} />;
}
