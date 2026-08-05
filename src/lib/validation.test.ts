import { describe, it, expect } from "vitest";
import {
  isAllowedImage,
  contactInput,
  paintingInput,
  categoryInput,
} from "./validation";

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

describe("long admin-authored descriptions", () => {
  // A full artist statement runs well past the old 5k/2k caps, and the DB
  // columns are `text` — an over-length reject used to blank the edit page
  // and silently drop the editor's work.
  const long = "მუზეუმი. ".repeat(4000); // ~36k chars

  it("accepts a long painting description", () => {
    expect(
      paintingInput.safeParse({
        title: "The Body of the City",
        description: long,
        categoryId: 1,
      }).success,
    ).toBe(true);
  });

  it("accepts a long category description", () => {
    expect(categoryInput.safeParse({ name: "Installations", description: long }).success).toBe(
      true,
    );
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
