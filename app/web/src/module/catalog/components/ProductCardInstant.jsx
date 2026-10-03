import { ClockIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatInstantCardEta } from "@/module/catalog/lib/instant-card-copy";

export function ProductCardInstantBadge({ instant, className }) {
  if (!instant?.enabled || !instant.showBadge) return null;
  const label = (instant.badgeLabel || "Instant").trim() || "Instant";
  return (
    <span
      className={cn(
        "absolute top-2 left-2 z-1 max-w-[85%] truncate rounded-md bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm sm:text-[11px]",
        className,
      )}
    >
      {label}
    </span>
  );
}

export function ProductCardInstantEta({ instant, className, size = "rail" }) {
  if (!instant?.enabled) return null;
  const eta = formatInstantCardEta(instant.etaMinutes);
  if (!eta) return null;
  const textClass =
    size === "rail" ? "text-[11px] font-medium sm:text-xs" : "text-xs font-medium";

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 text-foreground",
        textClass,
        className,
      )}
      title={`${eta} setup after confirmation`}
    >
      <span
        className="flex size-[1.125rem] shrink-0 items-center justify-center rounded-full bg-blue-600/15 text-blue-600 dark:text-blue-400"
        aria-hidden
      >
        <ClockIcon className="size-2.5" strokeWidth={2.25} />
      </span>
      <span className="tabular-nums leading-none">{eta}</span>
    </div>
  );
}
