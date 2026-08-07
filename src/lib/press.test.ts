import { describe, it, expect } from "vitest";
import { readLabel, fillsBox } from "./press";

describe("fillsBox", () => {
  it("lets a landscape photograph fill the window", () => {
    expect(fillsBox(1540, 1080)).toBe(true); // the Forbes photograph
    expect(fillsBox(1200, 800)).toBe(true);
  });

  it("shows a magazine page whole rather than cropping it to a strip", () => {
    expect(fillsBox(1494, 2048)).toBe(false); // the Beaumonde scan
    expect(fillsBox(1000, 1000)).toBe(false);
  });

  it("does not gamble when the dimensions are unknown", () => {
    expect(fillsBox(null, null)).toBe(false);
    expect(fillsBox(1200, null)).toBe(false);
  });
});

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
