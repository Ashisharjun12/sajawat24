import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable, ScreenBackButton } from '@/components/shell';
import { openCartCheckout } from '@/module/booking/lib/open-cart-checkout';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { Href, router } from 'expo-router';
import { Search, ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type ProductDetailHeaderProps = {
  onBack: () => void;
  variant?: 'overlay' | 'solid';
};

export function ProductDetailHeader({ onBack, variant = 'overlay' }: ProductDetailHeaderProps) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const itemCount = useCartStore((s) => s.itemCount);
  const overlay = variant === 'overlay';

  return (
    <View
      className="absolute left-0 right-0 z-20 flex-row items-center justify-between px-3"
      style={{ top: insets.top + 4 }}>
      <ScreenBackButton
        onPress={onBack}
        className={
          overlay
            ? 'size-10 bg-black/35 active:bg-black/45'
            : 'size-10 bg-muted active:bg-muted'
        }
        iconClassName={overlay ? 'size-6 text-white' : 'text-foreground size-6'}
      />
      <View className="flex-row items-center gap-2">
        <ScalePressable
          onPress={() => router.push('/(app)/search' as Href)}
          haptic
          className={
            overlay
              ? 'size-10 items-center justify-center rounded-full bg-black/35'
              : 'size-10 items-center justify-center rounded-full bg-muted'
          }
          accessibilityRole="button"
          accessibilityLabel="Search">
          <Icon as={Search} className={overlay ? 'size-5 text-white' : 'text-foreground size-5'} />
        </ScalePressable>
        <ScalePressable
          haptic
          onPress={() => openCartCheckout(user, itemCount)}
          className={
            overlay
              ? 'size-10 items-center justify-center rounded-full bg-black/35'
              : 'size-10 items-center justify-center rounded-full bg-muted'
          }
          accessibilityRole="button"
          accessibilityLabel="Bag">
          <Icon as={ShoppingBag} className={overlay ? 'size-5 text-white' : 'text-foreground size-5'} />
          {itemCount > 0 ? (
            <View className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-primary px-1 py-0.5">
              <Text className="text-center text-[10px] font-bold text-primary-foreground">
                {itemCount > 9 ? '9+' : itemCount}
              </Text>
            </View>
          ) : null}
        </ScalePressable>
      </View>
    </View>
  );
}
