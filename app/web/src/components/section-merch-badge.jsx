import { sectionBadgeAppearance } from "@/lib/section-badge-color";
import { cn } from "@/lib/utils";

/** Badge for catalog section merchandising (e.g. Trending, Most popular). */
export function SectionMerchBadge({ label, color, variant = "corner", className }) {
  const text = label?.trim();
  if (!text) return null;

  const { className: colorClass, style } = sectionBadgeAppearance(color);

  if (variant === "inline") {
    return (
      <span
        className={cn(
          "inline-flex w-fit max-w-full truncate rounded-[var(--r-btn)] px-2.5 py-0.5 text-xs font-bold leading-tight",
          colorClass,
          className,
        )}
        style={style}
      >
        {text}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "absolute top-2 right-2 z-1 max-w-[85%] truncate rounded-md px-2 py-0.5 text-[10px] font-bold leading-tight shadow-sm sm:text-[11px]",
        colorClass,
        className,
      )}
      style={style}
    >
      {text}
    </span>
  );
}
