import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { HomeLocationPill } from '@/module/home/components/HomeLocationPill';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { Href, router } from 'expo-router';
import { Bell, ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';

type HomeTopBarProps = {
  onCityPress: () => void;
};

export function HomeTopBar({ onCityPress }: HomeTopBarProps) {
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);

  return (
    <View className="flex-row items-center justify-between gap-2">
      <HomeLocationPill onPress={onCityPress} />
      <View className="shrink-0 flex-row items-center gap-2">
        <ScalePressable
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cart"
          onPress={() => openCartCheckout(user, itemCount)}
          className="relative size-10 items-center justify-center rounded-full border border-border bg-surface">
          <Icon as={ShoppingBag} className="text-foreground size-5" />
          {itemCount > 0 ? (
            <View className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-primary px-1 py-0.5">
              <Text className="text-primary-foreground text-center text-[10px] font-bold">
                {itemCount > 9 ? '9+' : itemCount}
              </Text>
            </View>
          ) : null}
        </ScalePressable>
        <ScalePressable
          onPress={() => router.push('/(app)/notifications?from=home' as Href)}
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          className="size-10 items-center justify-center rounded-full border border-border bg-surface">
          <Icon as={Bell} className="text-foreground size-5" />
        </ScalePressable>
      </View>
    </View>
  );
}
