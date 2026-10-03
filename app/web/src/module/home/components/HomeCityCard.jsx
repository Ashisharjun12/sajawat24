import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export const CITY_TONES = [
  "from-amber-400 to-amber-200",
  "from-orange-400 to-rose-200",
  "from-emerald-600 to-lime-300",
  "from-sky-500 to-teal-200",
  "from-rose-400 to-rose-200",
  "from-slate-600 to-slate-300",
  "from-violet-500 to-fuchsia-200",
  "from-yellow-600 to-amber-300",
];

export function HomeCityCard({ city, index = 0, onSelect, className }) {
  const imageUrl = city.imageUrl;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(city)}
      className={cn(
        "relative h-[140px] w-full overflow-hidden rounded-[20px] p-5 text-left text-white transition-transform hover:scale-[1.02]",
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
