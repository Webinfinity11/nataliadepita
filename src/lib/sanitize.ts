import sanitizeHtmlLib from "sanitize-html";

// Pure-JS sanitizer (no jsdom) so it runs in the Vercel serverless runtime.
// Content is admin-authored (TipTap editor / migrated posts); the allowlist
// keeps formatting while stripping scripts, event handlers, and unknown tags.
export function sanitizeHtml(html: string): string {
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "p",
      "h2",
      "h3",
      "strong",
      "em",
      "ul",
      "ol",
      "li",
      "a",
      "blockquote",
      "br",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    allowedSchemes: ["http", "https", "mailto"],
  });
}
