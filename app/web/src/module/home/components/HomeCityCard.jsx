import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Right image column ~176×116 CSS px; use 2× assets for retina. */
export const CITY_CARD_IMAGE_SPECS = {
  widthPx: 800,
  heightPx: 480,
  aspectRatio: "5:3",
  format: "PNG (transparent background) or WebP",
  notes:
    "Fill the canvas; align landmark group to bottom-right. No extra transparent margin on the left of the file.",
};

const CARD_HEIGHT = "h-[108px] md:h-[120px]";
const VIEW_ALL_HEIGHT = "h-[108px] md:h-[120px]";

export function HomeCityCard({ city, onSelect, className }) {
  const imageUrl = city.imageUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(city)}
      className={cn(
        "group relative w-full overflow-hidden rounded-[var(--r-card)] border border-border/80 bg-card text-left shadow-[var(--shadow-card)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-md",
        CARD_HEIGHT,
        className,
      )}
    >
      {/* Mobile: text sits in the top band above the skyline so it never overlaps the image.
          Desktop: text is vertically centered beside the image as before. */}
      <div className="relative z-10 flex h-full max-w-[85%] flex-col justify-start pt-2 pb-2.5 pl-3 pr-0.5 md:max-w-[48%] md:justify-center md:py-3 md:pl-4 md:pr-1">
        <div className="flex min-w-0 items-center gap-0.5">
          <h4 className="truncate font-heading text-[15px] font-bold tracking-tight text-foreground md:text-[17px]">
            {city.name}
          </h4>
          <ChevronRightIcon
            className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary md:size-4"
            aria-hidden
          />
        </div>
        {city.state ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground md:text-[13px]">{city.state}</p>
        ) : null}
      </div>
      {imageUrl ? (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 left-[26%] flex items-end justify-end md:left-[30%]"
          aria-hidden
        >
          <img
            src={imageUrl}
            alt=""
            width={400}
            height={240}
            className="max-h-[58%] w-full max-w-none object-contain object-bottom-right md:max-h-full"
            decoding="async"
          />
        </div>
      ) : null}
    </button>
  );
}

export function HomeCityViewAllCard({ className }) {
  return (
    <span
      className={cn(
        "group flex w-full items-center gap-2 overflow-hidden rounded-[var(--r-card)] border border-dashed border-primary/35 bg-secondary/60 px-3 py-2.5 text-left shadow-[var(--shadow-card)] transition-[border-color,background-color] hover:border-primary/50 hover:bg-secondary md:gap-3 md:px-4 md:py-3",
        VIEW_ALL_HEIGHT,
        className,
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-0.5">
          <span className="font-heading text-[15px] font-bold leading-tight tracking-tight text-foreground md:text-[17px]">
            View all cities
          </span>
          <ChevronRightIcon
            className="size-3.5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 md:size-4"
            aria-hidden
          />
        </div>
        <p className="mt-0.5 text-[11px] text-muted-foreground md:text-[13px]">See every location we serve</p>
      </div>
    </span>
  );
}
