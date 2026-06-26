import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import AdminNav from "@/components/admin/AdminNav";
import { logout } from "../login/actions";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="admin-shell min-h-screen bg-ink-50 text-ink-900 lg:grid lg:grid-cols-[248px_1fr]">
      <aside className="flex flex-col gap-6 border-b border-ink-200 bg-white px-5 py-5 lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r lg:py-7">
        <div className="flex items-center justify-between lg:block">
          <Link href="/admin" className="block">
            <span className="font-display text-xl tracking-tight text-ink-900">
              Natalia de Pita
            </span>
            <span className="mt-0.5 block text-[11px] uppercase tracking-[0.28em] text-ink-400">
              Studio Admin
            </span>
          </Link>
          {/* mobile logout */}
          <form action={logout} className="lg:hidden">
            <button className="text-sm text-danger-600">Log out</button>
          </form>
        </div>
        <AdminNav />
      </aside>

      <main className="px-5 py-8 lg:px-10 lg:py-10">
        <div className="mx-auto max-w-[1100px]">{children}</div>
      </main>
    </div>
  );
}
