import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { formatLocationLabel } from '@/lib/location-label';
import { HOME_WORLD_ICON_URI } from '@/module/home/lib/home-assets';
import { useCartStore } from '@/store/cart.store';
import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useLocationStore } from '@/store/location.store';
import { useAuthStore } from '@/store/auth.store';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { Href, router } from 'expo-router';
import { Image } from 'expo-image';
import { Bell, ChevronDown, ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';

type HomeTopBarProps = {
  onLocationPress?: () => void;
};

export function HomeTopBar({ onLocationPress }: HomeTopBarProps) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const locationLabel = formatLocationLabel(city, pincode);
  const headerSubtitle = useDeliveryLocationStore((s) => s.headerSubtitle);
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);

  const deliverName = user?.name?.trim() || 'you';
  const addressLine = headerSubtitle(locationLabel);

  return (
    <View className="flex-row items-center gap-2">
      <ScalePressable
        onPress={onLocationPress ?? (() => router.push(SELECT_LOCATION_HREF))}
        haptic
        className="min-w-0 flex-1 flex-row items-center gap-2 py-1"
        accessibilityRole="button"
        accessibilityLabel="Change delivery location">
        <Image
          source={{ uri: HOME_WORLD_ICON_URI }}
          style={{ width: 28, height: 28 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-0.5">
            <Text className="text-foreground text-sm" numberOfLines={1}>
              Deliver to{' '}
              <Text className="font-bold">{deliverName}</Text>
            </Text>
            <Icon as={ChevronDown} className="text-muted-foreground size-3.5 shrink-0" />
          </View>
          <Text className="text-muted-foreground mt-0.5 text-xs leading-4" numberOfLines={1}>
            {addressLine}
          </Text>
        </View>
      </ScalePressable>
      <View className="shrink-0 flex-row items-center gap-2">
        <ScalePressable
          haptic
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Cart"
          onPress={() => openCartCheckout(user, itemCount)}
          className="relative size-10 items-center justify-center rounded-full border border-border bg-background">
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
          className="size-10 items-center justify-center rounded-full border border-border bg-background">
          <Icon as={Bell} className="text-foreground size-5" />
        </ScalePressable>
      </View>
    </View>
  );
}
