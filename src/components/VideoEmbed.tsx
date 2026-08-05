import type { VideoEmbed as Embed } from "@/lib/video";

// An uploaded file has no provider to embed — it plays in the browser's own
// player, opening on its first frame.
export function VideoFile({
  url,
  poster,
  title,
  portrait = false,
}: {
  url: string;
  poster?: string | null;
  title?: string | null;
  portrait?: boolean;
}) {
  return (
    <div
      className={`w-full overflow-hidden bg-ink-100 ${
        portrait ? "mx-auto aspect-[9/16] max-w-[360px]" : "aspect-video"
      }`}
    >
      <video
        src={url}
        poster={poster ?? undefined}
        title={title ?? undefined}
        controls
        preload="metadata"
        playsInline
        className="h-full w-full bg-black object-contain"
      />
    </div>
  );
}

// Shared player frame: portrait clips (YouTube Shorts) get a 9:16 column,
// everything else the usual 16:9.
export function VideoEmbed({
  embed,
  title,
  className = "",
}: {
  embed: Embed;
  title?: string | null;
  className?: string;
}) {
  return (
    <div
      className={`w-full overflow-hidden bg-ink-100 ${
        embed.orientation === "portrait"
          ? "mx-auto aspect-[9/16] max-w-[360px]"
          : "aspect-video"
      } ${className}`}
    >
      <iframe
        src={embed.embedUrl}
        title={title ?? "Video"}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}
