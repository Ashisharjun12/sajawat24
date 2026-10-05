import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { Truck } from 'lucide-react-native';
import { View } from 'react-native';

export function ProductDeliveryEtaBanner() {
  return (
    <View className="flex-row items-start gap-2 rounded-lg bg-success/10 px-2.5 py-2">
      <Icon as={Truck} className="mt-0.5 size-3.5 text-success" />
      <Text className="text-foreground min-w-0 flex-1 text-[11px] leading-snug">
        Earliest delivery today by 2 PM. Faster options at checkout.
      </Text>
    </View>
  );
}
