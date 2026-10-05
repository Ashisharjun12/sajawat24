import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { MapPin, X } from 'lucide-react-native';
import { View } from 'react-native';

type LocationPermissionCardProps = {
  loading?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
};

export function LocationPermissionCard({
  loading,
  onAllow,
  onDismiss,
}: LocationPermissionCardProps) {
  return (
    <View className="mx-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="size-10 items-center justify-center rounded-xl bg-primary-tint">
          <Icon as={MapPin} className="size-5 text-primary" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-foreground text-sm font-semibold">Use your location</Text>
          <Text className="text-muted-foreground text-xs leading-5">
            See decorations and delivery options available near you. You can still pick a city
            manually anytime.
          </Text>
        </View>
        <ScalePressable
          onPress={onDismiss}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="size-8 items-center justify-center rounded-full">
          <Icon as={X} className="text-muted-foreground size-4" />
        </ScalePressable>
      </View>
      <View className="mt-3 flex-row gap-2">
        <Button variant="primary" size="md" className="flex-1" loading={loading} onPress={onAllow}>
          <Text>Allow</Text>
        </Button>
        <Button
          variant="secondary"
          size="md"
          className="flex-1"
          disabled={loading}
          onPress={onDismiss}>
          <Text>Not now</Text>
        </Button>
      </View>
    </View>
  );
}
