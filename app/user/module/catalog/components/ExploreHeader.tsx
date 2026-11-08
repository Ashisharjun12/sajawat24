import { ScalePressable, ScreenBackButton } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { HomeHeaderIconBadge } from '@/module/home/components/HomeHeaderIconBadge';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { type Href, router } from 'expo-router';
import { Heart, Search, ShoppingCart } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

type ExploreHeaderProps = {
  title: string;
  subtitle?: string | null;
  onBack: () => void;
  backAccessibilityLabel?: string;
};

/** Listing header — back, title + item count, search and cart. Stays fixed while content scrolls. */
export function ExploreHeader({
  title,
  subtitle,
  onBack,
  backAccessibilityLabel = 'Go back',
}: ExploreHeaderProps) {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);
  const wishlistCount = useWishlistStore((s) => s.rows.length);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateWishlist();
  }, [hydrateWishlist]);

  return (
    <View className="z-10 min-h-14 flex-row items-center gap-1 border-b border-border/60 bg-background px-2 pb-2 pt-1">
      <ScreenBackButton
        onPress={onBack}
        accessibilityLabel={backAccessibilityLabel}
        className="size-10 bg-transparent active:bg-muted"
        iconClassName="size-6 text-foreground"
      />
      <View className="min-w-0 flex-1 pl-1">
        <Text className="text-foreground text-lg font-bold tracking-tight" numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-muted-foreground text-xs" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ScalePressable
        onPress={() => router.push('/(app)/search' as Href)}
        haptic
        hitSlop={6}
        className="size-10 items-center justify-center rounded-full active:bg-muted"
        accessibilityRole="button"
        accessibilityLabel="Search">
        <Icon as={Search} className="text-foreground size-6" />
      </ScalePressable>
      <ScalePressable
        onPress={() => router.push('/(app)/wishlist' as Href)}
        haptic
        hitSlop={6}
        className="size-10 items-center justify-center rounded-full active:bg-muted"
        accessibilityRole="button"
        accessibilityLabel={wishlistCount > 0 ? `Wishlist, ${wishlistCount} items` : 'Wishlist'}>
        <Icon as={Heart} className="text-foreground size-6" />
        <HomeHeaderIconBadge count={wishlistCount} />
      </ScalePressable>
      <ScalePressable
        onPress={() => openCartCheckout(user, itemCount)}
        haptic
        hitSlop={6}
        className="size-10 items-center justify-center rounded-full active:bg-muted"
        accessibilityRole="button"
        accessibilityLabel={itemCount > 0 ? `Cart, ${itemCount} items` : 'Cart'}>
        <Icon as={ShoppingCart} className="text-foreground size-6" />
        <HomeHeaderIconBadge count={itemCount} />
      </ScalePressable>
    </View>
  );
}
