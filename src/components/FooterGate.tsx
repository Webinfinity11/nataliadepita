"use client";

import { usePathname } from "next/navigation";

// Hides the footer on the homepage (slider-only landing); shows it everywhere else.
export default function FooterGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
