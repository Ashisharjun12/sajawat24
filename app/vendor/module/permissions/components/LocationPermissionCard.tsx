import { PressableScale } from '@/components/motion';
import { IconWell, Surface } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { Map } from 'lucide-react-native';
import { Linking, View } from 'react-native';

type LocationPermissionCardProps = {
  className?: string;
};

export function LocationPermissionCard({ className }: LocationPermissionCardProps) {
  return (
    <Surface className={`bg-sky-500/5 p-4 ${className ?? ''}`}>
      <View className="flex-row gap-3">
        <IconWell icon={Map} className="bg-sky-500/15" />
        <View className="flex-1 gap-2">
          <Text className="text-foreground text-sm font-medium">Turn on location</Text>
          <Text className="text-muted-foreground text-sm">
            Needed when you go en route so customers can track your arrival.
          </Text>
          <PressableScale onPress={() => Linking.openSettings()}>
            <Text className="text-sm font-medium text-primary">Open Settings</Text>
          </PressableScale>
        </View>
      </View>
    </Surface>
  );
}
