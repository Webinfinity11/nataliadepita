import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { logout } from "../login/actions";

const NAV = [
  ["Dashboard", "/admin"],
  ["Categories", "/admin/categories"],
  ["Paintings", "/admin/paintings"],
  ["Featured", "/admin/featured"],
  ["Blog", "/admin/blog"],
  ["Settings", "/admin/settings"],
  ["Messages", "/admin/messages"],
] as const;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return (
    <div className="min-h-screen grid grid-cols-[220px_1fr]">
      <aside className="border-r p-4 space-y-2">
        {NAV.map(([label, href]) => (
          <Link key={href} href={href} className="block hover:underline">
            {label}
          </Link>
        ))}
        <form action={logout} className="pt-4">
          <button className="text-sm text-red-600">Log out</button>
        </form>
      </aside>
      <main className="p-8">{children}</main>
    </div>
  );
}
