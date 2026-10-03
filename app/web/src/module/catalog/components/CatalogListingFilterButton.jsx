import { SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CatalogListingFilterButton({
  activeCount = 0,
  onClick,
  className,
}) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={onClick}
    >
      <SlidersHorizontalIcon className="size-4" />
      Filter
      {activeCount > 0 ? (
        <span className="ml-1 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
          {activeCount}
        </span>
      ) : null}
    </Button>
  );
}
