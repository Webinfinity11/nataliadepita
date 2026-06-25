import { describe, it, expect } from "vitest";
import { slugify, uniqueSlug } from "./slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Black & White")).toBe("black-white");
    expect(slugify("  Tower of  Babel ")).toBe("tower-of-babel");
  });
  it("strips diacritics and symbols", () => {
    expect(slugify("Psyché (the Soul)")).toBe("psyche-the-soul");
  });
});

describe("uniqueSlug", () => {
  it("returns base when free", () => {
    expect(uniqueSlug("art", [])).toBe("art");
  });
  it("appends -2, -3 when taken", () => {
    expect(uniqueSlug("art", ["art"])).toBe("art-2");
    expect(uniqueSlug("art", ["art", "art-2"])).toBe("art-3");
  });
});
