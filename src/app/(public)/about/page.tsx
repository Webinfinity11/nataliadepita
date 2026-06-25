import { getSettings } from "@/lib/queries";
import { RichText } from "@/components/RichText";

export default async function AboutPage() {
  const s = await getSettings();
  return (
    <main>
      <section className="mx-auto max-w-[1320px] px-6 py-14 lg:px-12 lg:py-20">
        <p className="mb-10 border-b border-ink-200 pb-6 text-xs uppercase tracking-[0.3em] text-ink-500">
          About
        </p>
        {s?.aboutContent ? (
          <article className="max-w-3xl">
            <RichText html={s.aboutContent} />
          </article>
        ) : (
          <p className="font-display text-3xl text-ink-400">Coming soon.</p>
        )}
      </section>
    </main>
  );
}
