import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession } from "./auth";

export const SESSION_COOKIE = "session";

export async function getSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}
