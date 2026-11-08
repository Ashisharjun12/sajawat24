import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';
import type { HomeCatalogProduct } from '@/module/home/lib/home-catalog';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { HomeHeaderIconBadge } from '@/module/home/components/HomeHeaderIconBadge';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { type Href, router } from 'expo-router';
import { ArrowLeft, Heart, Search, ShoppingCart } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProductPdpTopBarProps = {
  onBack: () => void;
  wishlistProduct?: Pick<
    HomeCatalogProduct,
    'id' | 'title' | 'imageUrl' | 'pricePaise' | 'compareAtPaise'
  >;
};

const ACTION_CLASS = 'size-10 items-center justify-center rounded-full active:bg-muted';

/** Solid PDP header above the gallery — back on the left; search, wishlist, cart on the right. */
export function ProductPdpTopBar({ onBack, wishlistProduct }: ProductPdpTopBarProps) {
  const insets = useSafeAreaInsets();
  const wishlisted = useWishlistStore((s) =>
    wishlistProduct ? s.isWishlisted(wishlistProduct.id) : false,
  );
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <View
      className="z-10 flex-row items-center justify-between bg-background px-2 pb-1"
      style={{ paddingTop: insets.top + 4 }}>
      <ScalePressable
        onPress={onBack}
        haptic
        hitSlop={6}
        className={ACTION_CLASS}
        accessibilityRole="button"
        accessibilityLabel="Go back">
        <Icon as={ArrowLeft} className="size-6 text-foreground" />
      </ScalePressable>

      <View className="flex-row items-center gap-1">
        <ScalePressable
          onPress={() => router.push('/(app)/search' as Href)}
          haptic
          hitSlop={6}
          className={ACTION_CLASS}
          accessibilityRole="button"
          accessibilityLabel="Search">
          <Icon as={Search} className="size-6 text-foreground" />
        </ScalePressable>
        {wishlistProduct ? (
          <ScalePressable
            onPress={() => void toggleWishlist(wishlistProduct)}
            haptic
            hitSlop={6}
            className={ACTION_CLASS}
            accessibilityRole="button"
            accessibilityLabel={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}>
            <Icon
              as={Heart}
              className={cn('size-6', wishlisted ? 'text-instant' : 'text-foreground')}
              fill={wishlisted ? 'currentColor' : 'transparent'}
            />
          </ScalePressable>
        ) : null}
        <ScalePressable
          onPress={() => openCartCheckout(user, itemCount)}
          haptic
          hitSlop={6}
          className={ACTION_CLASS}
          accessibilityRole="button"
          accessibilityLabel={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}>
          <Icon as={ShoppingCart} className="size-6 text-foreground" />
          <HomeHeaderIconBadge count={itemCount} />
        </ScalePressable>
      </View>
    </View>
  );
}
