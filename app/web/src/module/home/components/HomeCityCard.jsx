import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const CITY_TONES = [
  "from-teal-700 to-teal-400",
  "from-teal-800 to-emerald-400",
  "from-cyan-700 to-teal-300",
  "from-teal-600 to-cyan-300",
  "from-emerald-700 to-teal-300",
  "from-slate-700 to-teal-400",
  "from-teal-900 to-teal-500",
  "from-cyan-800 to-teal-400",
];

export function HomeCityCard({ city, index = 0, onSelect, className }) {
  const imageUrl = city.imageUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(city)}
      className={cn(
        "relative h-[140px] w-full overflow-hidden rounded-[var(--r-card)] p-5 text-left text-white transition-shadow hover:shadow-md",
        imageUrl ? "bg-cover bg-center" : `bg-linear-to-br ${CITY_TONES[index % CITY_TONES.length]}`,
        className,
      )}
      style={imageUrl ? { backgroundImage: `url(${imageUrl})` } : undefined}
    >
      {imageUrl ? (
        <span className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/70 via-black/25 to-black/10" />
      ) : null}
      <h4 className="relative font-heading text-[19px] font-extrabold">{city.name}</h4>
      <span className="relative text-[12.5px] text-white/90">{city.state}</span>
      <span className="absolute right-4 bottom-4 flex size-8 items-center justify-center rounded-full bg-white/25">
        <ArrowRightIcon className="size-4" />
      </span>
    </button>
  );
}
