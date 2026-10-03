import { PLAY_STORE_URL } from "@/lib/env";

export function FooterGetTheApp() {
  return (
    <div className="flex flex-col items-end gap-1.5">
      <span className="text-sm font-semibold text-foreground">Get the app</span>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <img
          src="/google-play-badge.svg"
          alt="Get it on Google Play"
          className="h-10 w-auto sm:h-11"
          width={338}
          height={100}
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
}
