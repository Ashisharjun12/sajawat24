import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist.store";

export function WishlistButton({ variant = "default", className }) {
  const count = useWishlistStore((s) => s.rows.length);
  const isHero = variant === "hero";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn(
        "relative shrink-0",
        isHero &&
          "size-11 rounded-[var(--r-btn)] border border-primary-foreground/15 bg-background text-foreground shadow-sm hover:bg-background/95 hover:text-foreground",
        className,
      )}
      asChild
    >
      <Link to="/wishlist" aria-label="Wishlist">
        <Heart className={cn(isHero && "size-5 text-primary")} />
        {count > 0 ? (
          <span
            className={cn(
              "absolute flex items-center justify-center rounded-full bg-instant text-[10px] font-bold text-white",
              isHero ? "-top-1 -right-1 size-[18px]" : "-top-0.5 -right-0.5 size-4",
            )}
          >
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </Link>
    </Button>
  );
}
