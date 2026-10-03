import { MapsPinIcon } from "@/components/maps-pin-icon";
import { cn } from "@/lib/utils";

export function OpenInMapsChip({ onClick, className, label = "Open in Maps" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "z-10 flex items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-2 text-xs font-semibold text-foreground shadow-md transition-colors hover:bg-muted",
        className,
      )}>
      <MapsPinIcon size={18} className="shrink-0" />
      {label}
    </button>
  );
}
