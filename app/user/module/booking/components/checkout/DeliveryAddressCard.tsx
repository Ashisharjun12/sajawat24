import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { ChevronRight, MapPin } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { View } from 'react-native';

type DeliveryAddressCardProps = {
  label: string;
  addressLine: string;
  hasServiceableAddress: boolean;
  onPress: () => void;
};

export function DeliveryAddressCard({
  label,
  addressLine,
  hasServiceableAddress,
  onPress,
}: DeliveryAddressCardProps) {
  if (!hasServiceableAddress) {
    return (
      <ScalePressable
        haptic
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Add delivery address"
        className="flex-row items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <View className="size-10 items-center justify-center rounded-full bg-muted">
          <Icon as={MapPin} className="text-foreground size-5" />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-base font-semibold">Add delivery address</Text>
          <Text className="text-muted-foreground mt-0.5 text-sm">
            Select a saved address or add a new one
          </Text>
        </View>
        <Icon as={ChevronRight} className="text-muted-foreground size-5" />
      </ScalePressable>
    );
  }

  return (
    <View className="rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="text-foreground min-w-0 flex-1 text-base font-semibold" numberOfLines={1}>
          Deliver to {label}
        </Text>
        <ScalePressable
          haptic
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel="Change delivery address"
          className="shrink-0 flex-row items-center gap-0.5">
          <Text className="text-foreground text-sm font-semibold">Change</Text>
          <Icon as={ChevronRight} className="text-foreground size-4" />
        </ScalePressable>
      </View>
      <Text className="text-muted-foreground mt-1.5 text-sm leading-relaxed">{addressLine}</Text>
    </View>
  );
}
