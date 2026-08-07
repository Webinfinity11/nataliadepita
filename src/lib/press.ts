// Every press entry is shown in the same 3:2 window, so the page has one
// rhythm instead of a different one per photograph.
export const PRESS_IMAGE_RATIO = 3 / 2;

// Whether a picture can fill that window without losing anything that matters.
// A press photograph shot landscape is a hair off 3:2 and cropping it by a few
// percent is invisible; a photographed magazine page is nowhere near, and
// cropping it to a strip would throw the article away. Those are shown whole,
// centred on the card's own ground. Unknown dimensions are treated as the
// second case — better a small picture than a mutilated one.
export function fillsBox(
  width: number | null,
  height: number | null,
  tolerance = 0.2,
): boolean {
  if (!width || !height) return false;
  const ratio = width / height;
  return Math.abs(ratio - PRESS_IMAGE_RATIO) / PRESS_IMAGE_RATIO <= tolerance;
}

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
