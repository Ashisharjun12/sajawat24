import { CalendarDaysIcon, ZapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function FulfillmentModeSwitch({ value, onChange, instantLabel }) {
  const isScheduled = value === "scheduled";
  const isInstant = value === "instant";

  return (
    <div className="flex w-full border-b border-border">
      <button
        type="button"
        onClick={() => onChange("scheduled")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 border-b-2 px-2 pb-3 pt-1 text-sm font-semibold transition-colors",
          isScheduled
            ? "-mb-px border-primary text-primary"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <CalendarDaysIcon
          className={cn("size-5 shrink-0", isScheduled ? "text-primary" : "text-muted-foreground")}
          aria-hidden
        />
        Schedule
      </button>
      <button
        type="button"
        onClick={() => onChange("instant")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 border-b-2 px-2 pb-3 pt-1 text-sm font-semibold transition-colors",
          isInstant
            ? "-mb-px border-instant text-instant"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <ZapIcon
          className={cn(
            "size-5 shrink-0",
            isInstant ? "fill-current text-instant" : "text-muted-foreground",
          )}
          aria-hidden
        />
        {instantLabel || "Instant"}
      </button>
    </div>
  );
}
