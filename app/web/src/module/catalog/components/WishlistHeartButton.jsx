import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useWishlistStore } from "@/store/wishlist.store";

export function WishlistHeartButton({ product, className, size = "sm" }) {
  const wishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "size-8 rounded-full border border-border/40 bg-background/95 shadow-sm",
        size === "md" && "size-10",
        className,
      )}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void toggle(product);
      }}
    >
      <Heart
        className={cn("size-4", wishlisted ? "fill-instant text-instant" : "text-muted-foreground")}
        strokeWidth={2.25}
      />
    </Button>
  );
}
