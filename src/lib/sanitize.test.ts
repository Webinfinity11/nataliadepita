import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "./sanitize";

describe("sanitizeHtml", () => {
  it("keeps headings and bold", () => {
    expect(sanitizeHtml("<h2>Hi</h2><strong>bold</strong>")).toContain(
      "<strong>bold</strong>",
    );
  });
  it("removes script tags", () => {
    expect(sanitizeHtml("<p>ok</p><script>alert(1)</script>")).not.toContain(
      "script",
    );
  });
});
