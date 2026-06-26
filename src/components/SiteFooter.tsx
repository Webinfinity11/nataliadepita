type Settings = {
  contactEmail?: string | null;
  phone?: string | null;
  socialLinks?: { label: string; url: string }[] | null;
};

export default function SiteFooter({ settings }: { settings?: Settings }) {
  const email = settings?.contactEmail;
  const phone = settings?.phone;
  const socials = settings?.socialLinks ?? [];
  const hasDetails = !!email || !!phone || socials.length > 0;

  return (
    <footer className="border-t border-ink-200">
      {hasDetails && (
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-6 py-12 lg:flex-row lg:items-end lg:justify-end lg:px-12">
        <div className="flex flex-col gap-1.5 text-sm text-ink-600 lg:items-end">
          {email && (
            <a href={`mailto:${email}`} className="transition-colors hover:text-ink-900">
              {email}
            </a>
          )}
          {phone && (
            <a href={`tel:${phone.replace(/\s+/g, "")}`} className="transition-colors hover:text-ink-900">
              {phone}
            </a>
          )}
          {socials.length > 0 && (
            <div className="mt-3 flex gap-5 text-xs uppercase tracking-[0.22em] text-ink-500">
              {socials.map((s) => (
                <a
                  key={s.url}
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="transition-colors hover:text-ink-900"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      )}
      <div className="border-t border-ink-100 px-6 py-5 text-center lg:px-12">
        <p className="text-xs text-ink-400">
          Copyright © 2026 Created by{" "}
          <a
            href="http://infinity.ge/"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-ink-300 underline-offset-2 transition-colors hover:text-ink-700"
          >
            INFINITY
          </a>
        </p>
      </div>
    </footer>
  );
}
