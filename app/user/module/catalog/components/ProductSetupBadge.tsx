import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Timer } from 'lucide-react-native';
import { View } from 'react-native';

export function ProductSetupBadge() {
  return (
    <View className="flex-row items-center gap-2 self-start rounded-full bg-primary px-3.5 py-2">
      <Icon as={Timer} className="text-primary-foreground size-4" />
      <Text className="text-primary-foreground text-sm font-semibold">On-site setup in 1–1.5 hrs</Text>
    </View>
  );
}
