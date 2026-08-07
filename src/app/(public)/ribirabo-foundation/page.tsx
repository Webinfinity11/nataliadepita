import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ribirabo Foundation",
  description:
    "Foundation for the Support and Development of Georgian Mosaic, Applied Arts and Design.",
};

const FACEBOOK_URL = "https://www.facebook.com/Ribirabo.Foundation";

const PARAGRAPHS = [
  "The Ribirabo Foundation is an independent non-profit organization dedicated to the preservation, conservation, research, and contemporary development of Georgian mosaic art and applied design.",
  "The Foundation brings together heritage professionals, artists, conservators, architects, researchers, and cultural institutions to safeguard one of Georgia’s most distinctive artistic traditions while fostering its future development through innovation, education, and international collaboration.",
  "Ribirabo’s work encompasses the conservation and restoration of historic mosaics, documentation and research, the creation of contemporary public artworks, professional training, cultural heritage advocacy, and the implementation of interdisciplinary projects at both national and international levels. The Foundation actively collaborates with governmental institutions, museums, universities, local communities, and international organizations to promote best practices in heritage conservation and sustainable cultural development.",
  "Beyond preserving the past, the Ribirabo Foundation is committed to shaping the future of mosaic art as a living cultural practice. Through research, education, public engagement, and cross-border partnerships, The Ribirabo Foundation seeks to position Georgia as an international centre for excellence in the conservation, interpretation, and contemporary creation of mosaic and applied design.",
];

export default function RibiraboFoundationPage() {
  return (
    <main>
      <div className="mx-auto max-w-[1600px] px-6 lg:px-14">
        <header className="border-b border-ink-200 pb-8 pt-12 lg:pb-10 lg:pt-16">
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">
            Foundation
          </p>
          <h1 className="mt-6 font-display text-5xl leading-[1.04] tracking-tight text-ink-900 sm:text-6xl lg:text-7xl">
            Ribirabo Foundation
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-600">
            Foundation for the Support and Development of Georgian Mosaic,
            Applied Arts and Design
          </p>
        </header>

        <div className="grid gap-10 pb-16 pt-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-20 lg:pb-20 lg:pt-10">
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <h2 className="font-display text-3xl tracking-tight text-ink-900">
              About the Foundation
            </h2>
          </aside>

          <div className="max-w-[820px]">
            <div className="space-y-6">
              {PARAGRAPHS.map((text) => (
                <p key={text.slice(0, 40)} className="text-lg leading-relaxed text-ink-700">
                  {text}
                </p>
              ))}
            </div>

            <div className="mt-12 border-t border-ink-200 pt-10">
              <a
                href={FACEBOOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 bg-ink-900 px-6 py-3.5 text-sm font-medium text-ink-50 transition-opacity hover:opacity-90"
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden="true"
                >
                  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
                </svg>
                Ribirabo Foundation on Facebook
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
