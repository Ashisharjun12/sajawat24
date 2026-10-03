import { PressableScale } from '@/components/motion';
import { IconWell, Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { Bell } from 'lucide-react-native';
import { Linking, View } from 'react-native';

type NotificationPermissionCardProps = {
  className?: string;
};

export function NotificationPermissionCard({ className }: NotificationPermissionCardProps) {
  return (
    <Surface className={`bg-primary/5 p-4 ${className ?? ''}`}>
      <View className="flex-row gap-3">
        <IconWell icon={Bell} className="bg-primary/20" />
        <View className="flex-1 gap-2">
          <Text className="text-foreground text-sm font-medium">Turn on notifications</Text>
          <Text className="text-muted-foreground text-sm">
            Get instant alerts when Decoryy assigns you a new booking.
          </Text>
          <PressableScale onPress={() => Linking.openSettings()}>
            <Text className="text-sm font-medium text-primary">Open Settings</Text>
          </PressableScale>
        </View>
      </View>
    </Surface>
  );
}
