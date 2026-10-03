import { ScalePressable } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Bell, X } from 'lucide-react-native';
import { View } from 'react-native';

type NotificationPermissionCardProps = {
  loading?: boolean;
  onAllow: () => void;
  onDismiss: () => void;
};

export function NotificationPermissionCard({
  loading,
  onAllow,
  onDismiss,
}: NotificationPermissionCardProps) {
  return (
    <View className="mx-4 rounded-2xl border border-border bg-card p-4">
      <View className="flex-row items-start gap-3">
        <View className="bg-primary/15 size-10 items-center justify-center rounded-xl">
          <Icon as={Bell} className="text-primary size-5" />
        </View>
        <View className="min-w-0 flex-1 gap-1">
          <Text className="text-foreground text-sm font-semibold">Turn on notifications</Text>
          <Text className="text-muted-foreground text-xs leading-5">
            Get order updates, booking reminders, and offers for your area.
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
        <Button
          className="h-10 flex-1 rounded-full"
          disabled={loading}
          onPress={onAllow}>
          <Text className="text-sm font-semibold">{loading ? 'Please wait…' : 'Allow'}</Text>
        </Button>
        <Button
          variant="outline"
          className="h-10 flex-1 rounded-full"
          disabled={loading}
          onPress={onDismiss}>
          <Text className="text-sm">Not now</Text>
        </Button>
      </View>
    </View>
  );
}
