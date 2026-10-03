import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

export function NotificationEmpty() {
  return (
    <View className="items-center gap-3 rounded-3xl bg-muted/50 px-6 py-14">
      <IconWell icon={Bell} size="lg" className="bg-muted" iconClassName="text-muted-foreground" />
      <Text className="text-muted-foreground text-center text-sm">
        No notifications yet. New booking alerts will show up here.
      </Text>
    </View>
  );
}
