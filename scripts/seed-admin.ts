import { config } from "dotenv";
config({ path: [".env.local", ".env"] });
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { adminUsers } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth";

async function main() {
  const email = process.env.ADMIN_EMAIL!;
  const password = process.env.ADMIN_PASSWORD!;
  if (!email || !password) throw new Error("Set ADMIN_EMAIL and ADMIN_PASSWORD");

  const hash = await hashPassword(password);
  const existing = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, email));

  if (existing.length) {
    await db
      .update(adminUsers)
      .set({ passwordHash: hash })
      .where(eq(adminUsers.email, email));
    console.log("Admin password updated:", email);
  } else {
    await db.insert(adminUsers).values({ email, passwordHash: hash });
    console.log("Admin created:", email);
  }
}

main().then(() => process.exit(0));
