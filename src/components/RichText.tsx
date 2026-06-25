import { sanitizeHtml } from "@/lib/sanitize";

export function RichText({ html }: { html: string }) {
  return (
    <div
      className="prose prose-lg max-w-none text-ink-700 prose-headings:font-display prose-headings:font-normal prose-headings:tracking-tight prose-headings:text-ink-900 prose-p:leading-relaxed prose-a:text-ink-900 prose-a:underline-offset-4 prose-strong:text-ink-900 prose-blockquote:border-ink-900 prose-blockquote:font-display prose-blockquote:not-italic prose-img:bg-ink-100"
      dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }}
    />
  );
}
