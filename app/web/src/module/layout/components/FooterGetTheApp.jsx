import { cn } from "@/lib/utils";
import { PLAY_STORE_URL } from "@/lib/env";

export function FooterGetTheApp({ onBrand = false, className, compact = false }) {
  return (
    <div className={cn("flex flex-col items-end gap-1.5", compact && "gap-1", className)}>
      <span
        className={cn(
          compact ? "text-[11px] font-semibold leading-tight" : "text-sm font-semibold",
          onBrand ? "text-primary-foreground" : "text-foreground",
        )}
      >
        Get the app
      </span>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md outline-none ring-offset-background transition-opacity hover:opacity-90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <img
          src="/google-play-badge.svg"
          alt="Get it on Google Play"
          className={cn("w-auto", compact ? "h-8 max-w-[7.5rem]" : "h-10 sm:h-11")}
          width={338}
          height={100}
          loading="lazy"
          decoding="async"
        />
      </a>
    </div>
  );
}
