import { getFeaturedSlides } from "@/lib/queries";
import HomeHero from "@/components/HomeHero";

export default async function Home() {
  const slides = await getFeaturedSlides();
  return (
    <>
      <HomeHero slides={slides} />
      <section className="px-6 pb-28 pt-14 text-center lg:pb-40 lg:pt-20">
        <h1 className="mx-auto max-w-3xl font-display text-5xl leading-[1.02] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
          Natalia de&nbsp;Pita
        </h1>
        <p className="mx-auto mt-7 max-w-md text-lg leading-relaxed text-ink-600">
          Paintings and monumental mosaics.
        </p>
        <div className="mx-auto mt-12 h-px w-12 bg-ink-300" />
      </section>
    </>
  );
}
