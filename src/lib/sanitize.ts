import DOMPurify from "isomorphic-dompurify";

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
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
    ALLOWED_ATTR: ["href", "src", "alt", "target", "rel"],
  });
}
