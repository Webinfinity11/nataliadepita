import { describe, it, expect } from "vitest";
import { isAllowedImage, contactInput } from "./validation";

describe("isAllowedImage", () => {
  it("accepts jpeg under limit", () => {
    expect(isAllowedImage({ type: "image/jpeg", size: 1_000_000 })).toBe(true);
  });
  it("rejects pdf", () => {
    expect(isAllowedImage({ type: "application/pdf", size: 10 })).toBe(false);
  });
  it("rejects oversize", () => {
    expect(isAllowedImage({ type: "image/png", size: 20_000_000 })).toBe(false);
  });
});

describe("contactInput", () => {
  it("requires a valid email", () => {
    expect(
      contactInput.safeParse({ name: "A", email: "x", message: "hi" }).success,
    ).toBe(false);
    expect(
      contactInput.safeParse({ name: "A", email: "a@b.com", message: "hi" })
        .success,
    ).toBe(true);
  });
});
