import { Link } from "react-router-dom";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * "View all" button (rectangle, 8px corners) used by every section header (home category rows, product rails, PDP).
 * Theme-tinted (primary at 10%) so it follows light/dark and brand colour; same look as the user app.
 */
export const VIEW_ALL_LINK_CLASS =
  "inline-flex shrink-0 items-center gap-1 self-center whitespace-nowrap rounded-[8px] bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15 active:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:text-[13px]";

/** Label + arrow, for use inside an element with `VIEW_ALL_LINK_CLASS`. */
export function ViewAllContent({ children = "View all" }) {
  return (
    <>
      {children}
      <ArrowRightIcon className="size-3.5 shrink-0" strokeWidth={2.5} aria-hidden />
    </>
  );
}

export function ViewAllLink({ to, children = "View all", className }) {
  return (
    <Link to={to} className={cn(VIEW_ALL_LINK_CLASS, className)}>
      <ViewAllContent>{children}</ViewAllContent>
    </Link>
  );
}

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
      {viewAllHref ? <ViewAllLink to={viewAllHref}>{viewAllLabel}</ViewAllLink> : null}
    </div>
  );
}
