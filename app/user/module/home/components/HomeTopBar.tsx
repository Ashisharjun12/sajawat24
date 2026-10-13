import { Icon } from '@/components/ui/icon';
import { ScalePressable } from '@/components/shell';
import { HomeHeaderIconBadge } from '@/module/home/components/HomeHeaderIconBadge';
import { HomeLocationPill } from '@/module/home/components/HomeLocationPill';
import { useUserNotifications } from '@/module/notifications/hooks/use-user-notifications';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { Href, router } from 'expo-router';
import { useWishlistStore } from '@/store/wishlist.store';
import { Bell, Heart, ShoppingBag } from 'lucide-react-native';
import { useEffect } from 'react';
import { View } from 'react-native';

type HomeTopBarProps = {
  onCityPress: () => void;
};

const headerActionClass =
  'size-10 items-center justify-center rounded-full border border-primary-foreground/30 bg-primary-foreground/15';

export function HomeTopBar({ onCityPress }: HomeTopBarProps) {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);
  const wishlistCount = useWishlistStore((s) => s.rows.length);
  const hydrateWishlist = useWishlistStore((s) => s.hydrate);
  const { unreadCount } = useUserNotifications();

  useEffect(() => {
    void hydrateWishlist();
  }, [hydrateWishlist]);

  return (
    <View className="flex-row items-center justify-between gap-2">
      <HomeLocationPill onPress={onCityPress} />
      <View className="shrink-0 flex-row items-center gap-2">
        <ScalePressable
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Wishlist"
          onPress={() => router.push('/(app)/wishlist' as Href)}
          className={`relative ${headerActionClass}`}>
          <Icon as={Heart} className="size-5 text-primary-foreground" strokeWidth={2.25} />
          <HomeHeaderIconBadge count={wishlistCount} />
        </ScalePressable>
        <ScalePressable
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cart"
          onPress={() => openCartCheckout(user, itemCount)}
          className={`relative ${headerActionClass}`}>
          <Icon as={ShoppingBag} className="size-5 text-primary-foreground" strokeWidth={2.25} />
          <HomeHeaderIconBadge count={itemCount} />
        </ScalePressable>
        <ScalePressable
          onPress={() => router.push('/(app)/notifications?from=home' as Href)}
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className={`relative ${headerActionClass}`}>
          <Icon as={Bell} className="size-5 text-primary-foreground" strokeWidth={2.25} />
          <HomeHeaderIconBadge count={unreadCount} />
        </ScalePressable>
      </View>
    </View>
  );
}
