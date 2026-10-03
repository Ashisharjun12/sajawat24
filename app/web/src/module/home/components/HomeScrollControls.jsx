import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HomeScrollControls({
  onPrev,
  onNext,
  canPrev = false,
  canNext = false,
  className,
}) {
  const buttonClass =
    "size-7 rounded-full border-0 bg-amber-400 text-amber-950 shadow-sm hover:bg-amber-500 disabled:opacity-40 sm:size-8";

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={buttonClass}
        disabled={!canPrev}
        onClick={onPrev}
        aria-label="Scroll left"
      >
        <ChevronLeftIcon className="size-3.5 stroke-[2.5] sm:size-4" />
      </Button>
      <Button
        type="button"
        variant="default"
        size="icon"
        className={buttonClass}
        disabled={!canNext}
        onClick={onNext}
        aria-label="Scroll right"
      >
        <ChevronRightIcon className="size-3.5 stroke-[2.5] sm:size-4" />
      </Button>
    </div>
  );
}
