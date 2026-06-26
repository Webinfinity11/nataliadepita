import { getFeaturedSlides } from "@/lib/queries";
import HomeHero from "@/components/HomeHero";

export default async function Home() {
  const slides = await getFeaturedSlides();
  return <HomeHero slides={slides} />;
}
