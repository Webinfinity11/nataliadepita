import { describe, it, expect, beforeAll } from "vitest";
import {
  hashPassword,
  verifyPassword,
  signSession,
  verifySession,
} from "./auth";

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-test-secret-test-secret-32";
});

describe("password", () => {
  it("verifies a correct password and rejects a wrong one", async () => {
    const h = await hashPassword("hunter2");
    expect(await verifyPassword("hunter2", h)).toBe(true);
    expect(await verifyPassword("nope", h)).toBe(false);
  });
});

describe("session", () => {
  it("round-trips a signed token", async () => {
    const t = await signSession({ uid: 7 });
    expect((await verifySession(t))?.uid).toBe(7);
  });
  it("rejects a tampered token", async () => {
    expect(await verifySession("garbage.token.value")).toBeNull();
  });
});
