// Parse a YouTube / Vimeo watch URL into an embeddable player URL.

export type VideoEmbed = {
  provider: "youtube" | "vimeo";
  embedUrl: string;
};

export function parseVideo(url: string): VideoEmbed | null {
  const u = url.trim();

  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return { provider: "youtube", embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    return { provider: "vimeo", embedUrl: `https://player.vimeo.com/video/${vm[1]}` };
  }

  return null;
}

export function isSupportedVideoUrl(url: string): boolean {
  return parseVideo(url) !== null;
}
