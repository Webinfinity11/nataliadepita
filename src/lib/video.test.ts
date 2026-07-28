import { describe, it, expect } from "vitest";
import { parseVideo, isSupportedVideoUrl } from "./video";

describe("parseVideo — youtube", () => {
  it("handles watch, short and embed links", () => {
    for (const url of [
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      "https://youtu.be/dQw4w9WgXcQ",
      "https://www.youtube.com/embed/dQw4w9WgXcQ",
    ]) {
      expect(parseVideo(url)).toMatchObject({
        provider: "youtube",
        embedUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        orientation: "landscape",
      });
    }
  });
  it("marks shorts as portrait", () => {
    expect(parseVideo("https://www.youtube.com/shorts/dQw4w9WgXcQ")).toMatchObject({
      orientation: "portrait",
    });
  });
});

describe("parseVideo — vimeo", () => {
  it("builds the player url", () => {
    expect(parseVideo("https://vimeo.com/123456789")).toMatchObject({
      provider: "vimeo",
      embedUrl: "https://player.vimeo.com/video/123456789",
      orientation: "landscape",
    });
  });
});

describe("parseVideo — facebook", () => {
  const plugin = (href: string) =>
    `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(href)}&show_text=false`;

  it("embeds a reel", () => {
    expect(parseVideo("https://www.facebook.com/reel/469372649284440")).toEqual({
      provider: "facebook",
      embedUrl: plugin("https://www.facebook.com/reel/469372649284440"),
      orientation: "landscape",
    });
  });

  it("accepts reel, watch, page-video and video.php links as landscape", () => {
    for (const url of [
      "https://www.facebook.com/watch/?v=1234567890",
      "https://www.facebook.com/nataliadepita/videos/1234567890/",
      "https://www.facebook.com/video.php?v=1234567890",
      "https://www.facebook.com/share/v/AbCd1234/",
      "https://www.facebook.com/share/r/AbCd1234/",
    ]) {
      expect(parseVideo(url)).toMatchObject({
        provider: "facebook",
        orientation: "landscape",
      });
    }
  });

  it("normalises mobile and regional hosts to www", () => {
    expect(parseVideo("https://m.facebook.com/reel/469372649284440")?.embedUrl).toBe(
      plugin("https://www.facebook.com/reel/469372649284440"),
    );
    expect(parseVideo("web.facebook.com/reel/469372649284440")?.embedUrl).toBe(
      plugin("https://www.facebook.com/reel/469372649284440"),
    );
  });

  it("accepts fb.watch short links", () => {
    expect(parseVideo("https://fb.watch/AbCd1234x/")).toMatchObject({
      provider: "facebook",
    });
  });
});

describe("isSupportedVideoUrl", () => {
  it("rejects non-video links", () => {
    for (const url of [
      "",
      "not a url",
      "https://example.com/video",
      "https://www.facebook.com/nataliadepita",
      "https://www.facebook.com/watch/",
    ]) {
      expect(isSupportedVideoUrl(url)).toBe(false);
    }
  });
});
