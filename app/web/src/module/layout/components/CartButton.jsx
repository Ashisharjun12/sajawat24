import { ShoppingBagIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/store/cart.store";

export function CartButton({ variant = "default" }) {
  const count = useCartStore((s) => s.count);
  const setOpen = useCartStore((s) => s.setOpen);
  const isHero = variant === "hero";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "relative shrink-0",
        isHero &&
          "size-11 rounded-xl border border-primary-foreground/15 bg-background text-foreground shadow-sm hover:bg-background/95 hover:text-foreground",
      )}
      onClick={() => setOpen(true)}
      aria-label="Open bag"
    >
      <ShoppingBagIcon className={cn(isHero && "size-5 text-amber-900")} />
      <span className="sr-only">Bag</span>
      {count > 0 ? (
        <span
          className={cn(
            "absolute flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground",
            isHero ? "-top-1 -right-1 size-[18px]" : "-top-0.5 -right-0.5 size-4",
          )}
        >
          {count > 9 ? "9+" : count}
        </span>
      ) : null}
    </Button>
  );
}
