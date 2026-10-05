import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { lightImpact } from '@/lib/light-haptic';
import { homeActiveOrderTitle } from '@/module/account/lib/active-order';
import { useActiveOrderForHome } from '@/module/account/hooks/use-active-order-for-home';
import { type Href, router } from 'expo-router';
import { ChevronRight, Truck } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { View } from 'react-native';

/** Reserve scroll space so feed content clears the docked bar (px). */
export const HOME_ACTIVE_ORDER_BAR_HEIGHT = 72;

type Props = {
  enabled?: boolean;
};

export function HomeActiveOrderBar({ enabled = true }: Props) {
  const { primary, moreCount } = useActiveOrderForHome(enabled);

  if (!primary) return null;

  const title = homeActiveOrderTitle(primary.status);
  const subtitle =
    moreCount > 0
      ? `${moreCount + 1} active bookings`
      : 'Track live progress on your order';

  function openOrder() {
    lightImpact();
    router.push(`/(app)/profile/orders/${primary!.id}` as Href);
  }

  return (
    <ScalePressable haptic onPress={openOrder} className="active:opacity-95">
        <View className="flex-row items-center gap-3 rounded-t-card border-t border-border bg-surface px-4 py-3 shadow-raised">
          <View className="size-10 items-center justify-center rounded-pill bg-primary-tint">
            <Icon as={Truck} className="text-primary size-5" />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-body font-medium" numberOfLines={1}>
              {title}
            </Text>
            <Text className="text-muted-foreground text-caption" numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <View className="flex-row items-center gap-0.5">
            <Text className="text-primary text-caption font-semibold">View details</Text>
            <Icon as={ChevronRight} className="text-primary size-4" />
          </View>
        </View>
    </ScalePressable>
  );
}
