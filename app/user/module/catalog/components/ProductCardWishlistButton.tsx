import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { useWishlistStore } from '@/store/wishlist.store';
import { Heart } from 'lucide-react-native';
import { View } from 'react-native';

type ProductCardWishlistButtonProps = {
  product: Pick<HomeCatalogProduct, 'id' | 'title' | 'imageUrl' | 'pricePaise' | 'compareAtPaise'>;
  className?: string;
};

export function ProductCardWishlistButton({ product, className }: ProductCardWishlistButtonProps) {
  const wishlisted = useWishlistStore((s) => s.isWishlisted(product.id));
  const toggle = useWishlistStore((s) => s.toggle);

  return (
    <ScalePressable
      haptic
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      onPress={() => void toggle(product)}
      className={cn(className?.includes('static') ? 'z-[3]' : 'absolute z-[3]', className)}>
      <View className="size-8 items-center justify-center rounded-full border border-border/40 bg-white/95 shadow-sm">
        <Icon
          as={Heart}
          className={cn('size-4', wishlisted ? 'text-instant' : 'text-muted-foreground')}
          fill={wishlisted ? 'currentColor' : 'transparent'}
          strokeWidth={2.25}
        />
      </View>
    </ScalePressable>
  );
}
