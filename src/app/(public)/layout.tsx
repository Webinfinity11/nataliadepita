import { getNavCategories, getSettings } from "@/lib/queries";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import FooterGate from "@/components/FooterGate";

// Public pages read live data from the DB and reflect admin edits, so render
// them dynamically (inherited by all routes under this layout). This also keeps
// `next build` from trying to prerender DB-backed pages without a connection.
export const dynamic = "force-dynamic";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cats, settings] = await Promise.all([
    getNavCategories(),
    getSettings(),
  ]);
  return (
    <div className="flex min-h-screen flex-col bg-ink-50 text-ink-900">
      <SiteHeader categories={cats.map((c) => ({ name: c.name, slug: c.slug }))} />
      <main className="flex-1">{children}</main>
      <FooterGate>
        <SiteFooter settings={settings} />
      </FooterGate>
    </div>
  );
}
