import { cn } from "@/lib/utils";

export const SCHEDULE_FULFILLMENT_ICON_URL =
  "https://ik.imagekit.io/aevhlnk0h/schedule.png";
export const INSTANT_FULFILLMENT_ICON_URL =
  "https://ik.imagekit.io/aevhlnk0h/fast-time.png";

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
            ? "-mb-px border-primary text-foreground"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <img
          src={SCHEDULE_FULFILLMENT_ICON_URL}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
        />
        Schedule
      </button>
      <button
        type="button"
        onClick={() => onChange("instant")}
        className={cn(
          "flex flex-1 items-center justify-center gap-2 border-b-2 px-2 pb-3 pt-1 text-sm font-semibold transition-colors",
          isInstant
            ? "-mb-px border-orange-500 text-orange-600 dark:text-orange-400"
            : "border-transparent text-muted-foreground hover:text-foreground",
        )}
      >
        <img
          src={INSTANT_FULFILLMENT_ICON_URL}
          alt=""
          width={20}
          height={20}
          className="size-5 shrink-0 object-contain"
        />
        {instantLabel || "Instant"}
      </button>
    </div>
  );
}
