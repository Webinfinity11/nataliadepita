import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";

const secret = () => new TextEncoder().encode(process.env.AUTH_SECRET);

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(payload: { uid: number }): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
}

export async function verifySession(
  token: string,
): Promise<{ uid: number } | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return { uid: payload.uid as number };
  } catch {
    return null;
  }
}
