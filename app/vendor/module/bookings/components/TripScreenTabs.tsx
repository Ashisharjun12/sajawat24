import { PressableScale } from '@/components/motion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { View } from 'react-native';

export type TripScreenTab = 'onTheWay' | 'orderDetails';

type Props = {
  value: TripScreenTab;
  onChange: (tab: TripScreenTab) => void;
};

export function TripScreenTabs({ value, onChange }: Props) {
  return (
    <View className="flex-row border-b border-border/60">
      <PressableScale
        onPress={() => onChange('onTheWay')}
        className={cn(
          'flex-1 items-center border-b-2 px-2 pb-3 pt-1',
          value === 'onTheWay' ? '-mb-px border-primary' : 'border-transparent',
        )}>
        <Text
          className={cn(
            'text-sm font-semibold',
            value === 'onTheWay' ? 'text-foreground' : 'text-muted-foreground',
          )}>
          On the way
        </Text>
      </PressableScale>
      <PressableScale
        onPress={() => onChange('orderDetails')}
        className={cn(
          'flex-1 items-center border-b-2 px-2 pb-3 pt-1',
          value === 'orderDetails' ? '-mb-px border-primary' : 'border-transparent',
        )}>
        <Text
          className={cn(
            'text-sm font-semibold',
            value === 'orderDetails' ? 'text-foreground' : 'text-muted-foreground',
          )}>
          Order details
        </Text>
      </PressableScale>
    </View>
  );
}
