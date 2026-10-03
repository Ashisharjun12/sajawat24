import { cn } from "@/lib/utils";

export function HomeSectionHeading({
  title,
  subtitle,
  className,
  compact = false,
  hideSubtitle = false,
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <h2
        className={cn(
          "font-heading font-extrabold tracking-tight text-balance break-words whitespace-normal",
          compact
            ? "text-[1.0625rem] leading-snug sm:text-lg md:text-xl"
            : "text-[clamp(1.25rem,2.4vw,1.75rem)]",
        )}
      >
        {title}
      </h2>
      <span
        className={cn(
          "mt-1 block rounded-full bg-primary",
          compact ? "h-0.5 w-6" : "mt-1.5 h-1 w-8",
        )}
        aria-hidden
      />
      {subtitle && !hideSubtitle ? (
        <p
          className={cn(
            "max-w-[460px] text-muted-foreground",
            compact ? "mt-1.5 text-xs sm:text-[13px]" : "mt-2 text-[14px]",
          )}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
