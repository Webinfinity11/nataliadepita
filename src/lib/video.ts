// Parse a YouTube / Vimeo / Facebook watch URL into an embeddable player URL.

export type VideoProvider = "youtube" | "vimeo" | "facebook";

export type VideoEmbed = {
  provider: VideoProvider;
  embedUrl: string;
  // Reels and Shorts are shot vertically; everything else plays in a 16:9 frame.
  orientation: "landscape" | "portrait";
};

export function parseVideo(url: string): VideoEmbed | null {
  const u = url.trim();

  const yt = u.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|v\/)|youtu\.be\/)([\w-]{11})/,
  );
  if (yt) {
    return {
      provider: "youtube",
      embedUrl: `https://www.youtube.com/embed/${yt[1]}`,
      orientation: /youtube\.com\/shorts\//.test(u) ? "portrait" : "landscape",
    };
  }

  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) {
    return {
      provider: "vimeo",
      embedUrl: `https://player.vimeo.com/video/${vm[1]}`,
      orientation: "landscape",
    };
  }

  return parseFacebook(u);
}

export function isSupportedVideoUrl(url: string): boolean {
  return parseVideo(url) !== null;
}

// Facebook has no id-based player URL — its plugin takes the original post URL
// and renders the right player for reels, watch links and page videos alike.
function parseFacebook(raw: string): VideoEmbed | null {
  const url = toUrl(raw);
  if (!url) return null;

  const host = url.hostname
    .toLowerCase()
    .replace(/^(?:www|web|m|mbasic|business)\./, "");

  // Short share links (fb.watch/xxxx) resolve inside the plugin.
  if (host === "fb.watch") {
    return /^\/[\w-]+\/?$/.test(url.pathname)
      ? facebookEmbed(url.href, "landscape")
      : null;
  }

  if (host !== "facebook.com") return null;

  const path = url.pathname;

  // /reel/123… and /share/r/xxxx are the vertical reel formats.
  if (/^\/reel\/\d+/.test(path) || /^\/share\/r\/[\w-]+/.test(path)) {
    return facebookEmbed(canonical(url), "portrait");
  }

  const isVideo =
    (/^\/watch\/?$/.test(path) && url.searchParams.has("v")) ||
    (/^\/video\.php\/?$/.test(path) && url.searchParams.has("v")) ||
    /^\/[\w.-]+\/videos\/(?:[\w.-]+\/)?\d+/.test(path) ||
    /^\/share\/v\/[\w-]+/.test(path);

  return isVideo ? facebookEmbed(canonical(url), "landscape") : null;
}

function facebookEmbed(
  href: string,
  orientation: VideoEmbed["orientation"],
): VideoEmbed {
  return {
    provider: "facebook",
    embedUrl: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
      href,
    )}&show_text=false`,
    orientation,
  };
}

// Mobile and regional hosts embed inconsistently; the plugin wants www.
function canonical(url: URL): string {
  const c = new URL(url.href);
  c.protocol = "https:";
  c.hostname = "www.facebook.com";
  return c.href;
}

function toUrl(raw: string): URL | null {
  try {
    return new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
}
