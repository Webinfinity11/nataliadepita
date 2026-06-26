import { getSettings } from "@/lib/queries";
import { RichText } from "@/components/RichText";

const USEFUL_LINKS: { label: string; url: string }[] = [
  {
    label: "Presidential Administration of Georgia",
    url: "https://en.wikipedia.org/wiki/Presidential_Administration_of_Georgia",
  },
  { label: "Piazza Batumi", url: "http://gobatumi.com/en/catalog/686-piatsas-moedani" },
  { label: "Exhibition ATLANTIS ’11", url: "http://geoair.ge/ka/node/205" },
  { label: "Art Guild — Natali de Pita", url: "http://artguild.club/natali_de_pita.html" },
  { label: "Listed at AKOUN.COM", url: "https://www.akoun.com/SEARCH?ART=Natali%20De%20Pita" },
];

const Arrow = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="mt-1 shrink-0 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
  >
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default async function AboutPage() {
  const s = await getSettings();
  const about = s?.aboutContent?.trim();

  return (
    <main>
      <div className="mx-auto max-w-[1600px] px-6 lg:px-14">
        {/* header */}
        <header className="border-b border-ink-200 pb-8 pt-12 lg:pb-10 lg:pt-16">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">About</p>
          <h1 className="mt-6 font-display text-5xl leading-[1.04] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Natalia&nbsp;de&nbsp;Pita
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-ink-600">
            Painter and monumental mosaicist, born in Tbilisi. Working across
            Georgia, Paris, and Switzerland.
          </p>
        </header>

        {/* body */}
        <div className="grid gap-10 pb-16 pt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20 lg:pb-20 lg:pt-10">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              Biography
            </h2>
            <p className="mt-3 text-sm italic text-ink-500">
              by Lawrence Scott Sheets
            </p>
          </aside>

          <div className="max-w-[820px]">
            {about ? (
              <RichText html={about} />
            ) : (
              <p className="font-display text-3xl text-ink-400">Coming soon.</p>
            )}

            {/* useful links */}
            <div className="mt-16 border-t border-ink-200 pt-10">
              <h3 className="text-xs uppercase tracking-[0.3em] text-ink-500">
                Useful links
              </h3>
              <ul className="mt-6 space-y-1">
                {USEFUL_LINKS.map((l) => (
                  <li key={l.url}>
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-start gap-2 py-2 text-[15px] text-ink-700 transition-colors hover:text-ink-900"
                    >
                      <span className="underline decoration-ink-300 underline-offset-4 transition-colors group-hover:decoration-ink-900">
                        {l.label}
                      </span>
                      <Arrow />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
