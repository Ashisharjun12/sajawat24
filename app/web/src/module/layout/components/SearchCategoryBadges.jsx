import { ArrowUpRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const CHIP_PALETTE = [
  "border-emerald-200/80 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/90",
  "border-violet-200/80 bg-violet-50 text-violet-900 hover:bg-violet-100/90",
  "border-amber-200/80 bg-amber-50 text-amber-950 hover:bg-amber-100/90",
];

function chipStyle(index) {
  return CHIP_PALETTE[index % CHIP_PALETTE.length];
}

function BadgeLabel({ text, query }) {
  const trimmed = query.trim();
  if (!trimmed) {
    return text;
  }
  const lower = text.toLowerCase();
  const q = trimmed.toLowerCase();
  const index = lower.indexOf(q);
  if (index < 0) {
    return text;
  }
  return (
    <>
      {text.slice(0, index)}
      <span className="font-semibold">{text.slice(index, index + trimmed.length)}</span>
      {text.slice(index + trimmed.length)}
    </>
  );
}

export function SearchCategoryBadges({ hits, query, onSelect }) {
  if (!hits?.length) return null;

  return (
    <div className="flex flex-wrap gap-2 px-1 py-2">
      {hits.map((hit, index) => (
        <button
          key={hit.id}
          type="button"
          onClick={() => onSelect(hit)}
          className={cn(
            "inline-flex max-w-full items-center gap-1.5 rounded-lg border px-3 py-2 text-left text-[13px] font-medium leading-tight transition-colors",
            chipStyle(index),
          )}
        >
          <span className="min-w-0 truncate">
            <BadgeLabel text={hit.label} query={query} />
          </span>
          <ArrowUpRightIcon className="size-3.5 shrink-0 opacity-75" aria-hidden />
        </button>
      ))}
    </div>
  );
}
