const MARK = (
  <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94Z" />
);

// Stands in for the player when Facebook will not embed a video at all. Keeps
// the frame the grid expects, so the page does not lurch, and says where the
// video is instead of showing Facebook's own black "Video Unavailable" panel —
// which reads as a broken site rather than a video that lives elsewhere.
export function FacebookOnly({
  url,
  portrait = false,
}: {
  url: string;
  portrait?: boolean;
}) {
  return (
    <div
      className={`flex w-full flex-col items-center justify-center gap-5 border border-ink-200 bg-ink-100 px-6 text-center ${
        portrait ? "mx-auto aspect-[9/16] max-w-[360px]" : "aspect-video"
      }`}
    >
      <svg
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        className="text-ink-300"
      >
        {MARK}
      </svg>
      <p className="max-w-[26ch] text-sm leading-relaxed text-ink-500">
        This video plays on Facebook.
      </p>
      <WatchOnFacebook url={url} className="mt-0" />
    </div>
  );
}

// Facebook's plugin renders nothing at all for a video it will not embed —
// private, or using someone else's music or footage. The visitor sees a blank
// rectangle and reads it as a broken site. This says, without being asked,
// that the video exists and where it can be watched.
export function WatchOnFacebook({
  url,
  className = "mt-4",
}: {
  url: string;
  className?: string;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`group inline-flex items-center gap-2.5 border border-ink-900 bg-transparent px-5 py-2.5 text-[11px] uppercase tracking-[0.24em] text-ink-900 transition-colors duration-300 hover:bg-ink-900 hover:text-ink-50 ${className}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {MARK}
      </svg>
      Watch on Facebook
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="transition-transform duration-300 group-hover:translate-x-1"
        aria-hidden="true"
      >
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </a>
  );
}
