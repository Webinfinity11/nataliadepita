// Hosts worth naming properly; anything else is recognisable enough as itself.
const KNOWN: Record<string, string> = {
  "facebook.com": "Facebook",
  "instagram.com": "Instagram",
  "youtube.com": "YouTube",
  "youtu.be": "YouTube",
  "linkedin.com": "LinkedIn",
};

function hostName(url: string): string | null {
  try {
    const host = new URL(url).hostname
      .toLowerCase()
      .replace(/^(?:www|m|mobile|web)\./, "");
    return KNOWN[host] ?? host;
  } catch {
    return null;
  }
}

// What the button on the Press page should say. Normally the publication hosts
// its own article and naming it is both accurate and the most inviting thing to
// read. But a piece that only survives as a photograph of a magazine page is
// linked from wherever it was posted — and promising "Read on Beaumonde" while
// the link opens Facebook is a small lie the reader discovers a click too late.
// The publication still stands above the headline either way.
export function readLabel(publication: string | null, url: string): string {
  const host = hostName(url);
  if (!publication) return host ? `Read on ${host}` : "Read the article";
  // A latin word from the publication's name is enough to recognise its own
  // domain — "Forbes Georgia" against forbes.ge. Names written only in Georgian
  // give nothing to compare, so those fall back to naming the host.
  const word = publication.toLowerCase().match(/[a-z0-9]{4,}/)?.[0];
  if (host && word && host.toLowerCase().includes(word)) {
    return `Read on ${publication}`;
  }
  return host ? `Read on ${host}` : `Read on ${publication}`;
}
