"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { adminUsers } from "@/db/schema";
import { verifyPassword, signSession } from "@/lib/auth";
import { SESSION_COOKIE } from "@/lib/session";

export async function login(
  _prev: string | null,
  formData: FormData,
): Promise<string | null> {
  // the login may be a username rather than an email, and is case-insensitive
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const [user] = await db
    .select()
    .from(adminUsers)
    .where(sql`lower(${adminUsers.email}) = lower(${email})`);
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return "Invalid login or password";
  }
  const token = await signSession({ uid: user.id });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete(SESSION_COOKIE);
  redirect("/admin/login");
}
