import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

/** Matches homepage category row “View all →” link styling. */
export const VIEW_ALL_LINK_CLASS =
  "shrink-0 self-center whitespace-nowrap pt-0.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground sm:text-sm";

export function PdpProductRailHeader({
  title,
  subtitle,
  viewAllHref,
  viewAllLabel = "View all",
  className,
}) {
  return (
    <div className={cn("mb-3 flex items-start justify-between gap-3", className)}>
      <div className="min-w-0 flex-1">
        <h2 className="font-heading text-base font-bold tracking-tight text-foreground sm:text-lg">
          {title}
        </h2>
        {subtitle ? (
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:text-[13px]">
            {subtitle}
          </p>
        ) : null}
      </div>
      {viewAllHref ? (
        <Link to={viewAllHref} className={VIEW_ALL_LINK_CLASS}>
          {viewAllLabel} →
        </Link>
      ) : null}
    </div>
  );
}
