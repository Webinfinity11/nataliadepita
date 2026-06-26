import { getSettings, getFeatureImage } from "@/lib/queries";
import { ContactForm } from "./ContactForm";

export default async function ContactPage() {
  const [s, featureImage] = await Promise.all([getSettings(), getFeatureImage()]);
  const socials = s?.socialLinks ?? [];

  return (
    <main className="px-6 lg:px-12">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-12 pb-24 pt-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,44%)] lg:gap-20 lg:pb-28 lg:pt-20">
        {/* left — intro, form, details */}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-ink-500">Contact</p>
          <h1 className="mt-5 max-w-2xl font-display text-5xl leading-[1.04] tracking-tight text-ink-900 sm:text-6xl">
            Write to the studio
          </h1>
          <p className="mt-5 max-w-md text-lg leading-relaxed text-ink-600">
            For commissions, exhibitions, press, or a studio visit — a few words
            is enough to begin.
          </p>

          <div className="mb-12 mt-12 border-t border-ink-200" />

          <ContactForm />

          <div className="mt-12">
            {s?.contactEmail && (
              <DetailRow label="Email">
                <a
                  href={`mailto:${s.contactEmail}`}
                  className="text-ink-800 underline decoration-ink-300 underline-offset-4 transition-colors hover:decoration-ink-900"
                >
                  {s.contactEmail}
                </a>
              </DetailRow>
            )}
            {s?.phone && (
              <DetailRow label="Phone">
                <span className="text-ink-800">{s.phone}</span>
              </DetailRow>
            )}
            {socials.length > 0 && (
              <DetailRow label="Follow">
                <span className="flex flex-wrap gap-5 text-xs uppercase tracking-[0.22em] text-ink-600">
                  {socials.map((l) => (
                    <a
                      key={l.url}
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="transition-colors hover:text-ink-900"
                    >
                      {l.label}
                    </a>
                  ))}
                </span>
              </DetailRow>
            )}
          </div>
        </div>

        {/* right — feature artwork */}
        {featureImage && (
          <aside className="lg:pt-1">
            <div className="overflow-hidden bg-ink-100 shadow-[0_40px_80px_-50px_rgba(26,24,21,0.45)] lg:sticky lg:top-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={featureImage}
                alt="Artwork by Natalia de Pita"
                className="h-auto w-full object-cover"
              />
            </div>
          </aside>
        )}
      </div>
    </main>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-ink-100 py-5 sm:flex-row sm:items-baseline sm:gap-8">
      <span className="w-20 shrink-0 text-xs uppercase tracking-[0.24em] text-ink-400">
        {label}
      </span>
      <div className="text-base leading-relaxed">{children}</div>
    </div>
  );
}
