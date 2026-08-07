import { describe, it, expect } from "vitest";
import { readLabel } from "./press";

describe("readLabel", () => {
  it("names the publication when it hosts its own article", () => {
    expect(
      readLabel(
        "Forbes Georgia",
        "https://forbes.ge/saqarthvelos-mozaikuri-memkvidreobis-sadarajoze/",
      ),
    ).toBe("Read on Forbes Georgia");
  });

  it("names the host when the article lives somewhere else", () => {
    expect(
      readLabel(
        "ბომონდი • Beaumonde",
        "https://www.facebook.com/story.php?story_fbid=abc&id=1",
      ),
    ).toBe("Read on Facebook");
  });

  it("still says something useful without a publication", () => {
    expect(readLabel(null, "https://m.facebook.com/story.php?story_fbid=a")).toBe(
      "Read on Facebook",
    );
    expect(readLabel(null, "not a url")).toBe("Read the article");
  });

  it("falls back to the publication when the link cannot be read", () => {
    expect(readLabel("Beaumonde", "not a url")).toBe("Read on Beaumonde");
  });
});
