import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Truck } from 'lucide-react-native';
import { View } from 'react-native';

export function ProductDeliveryEtaBanner() {
  return (
    <View className="flex-row items-start gap-2 rounded-lg bg-emerald-50 px-2.5 py-2 dark:bg-emerald-950/30">
      <Icon as={Truck} className="mt-0.5 size-3.5 text-emerald-700 dark:text-emerald-400" />
      <Text className="text-emerald-900 min-w-0 flex-1 text-[11px] leading-snug dark:text-emerald-100">
        Earliest delivery today by 2 PM. Faster options at checkout.
      </Text>
    </View>
  );
}
