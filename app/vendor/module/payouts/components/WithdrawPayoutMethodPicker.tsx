import type { PayoutMethod } from '@/api/payout-methods.api';
import { PressableScale } from '@/components/motion';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { PayoutMethodIcon } from '@/module/payouts/components/PayoutMethodIcon';
import {
  formatPayoutMethodLabel,
  formatPayoutMethodSubtitle,
} from '@/module/payouts/lib/payout-method-format';
import { ScrollView, View } from 'react-native';

type WithdrawPayoutMethodPickerProps = {
  methods: PayoutMethod[];
  selectedMethodId: string;
  onSelectMethodId: (id: string) => void;
};

export function WithdrawPayoutMethodPicker({
  methods,
  selectedMethodId,
  onSelectMethodId,
}: WithdrawPayoutMethodPickerProps) {
  return (
    <View className="gap-2">
      <Text className="text-muted-foreground text-xs uppercase tracking-wide">Transfer to</Text>
      <ScrollView
        className="max-h-52"
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        keyboardShouldPersistTaps="handled">
        <View className="gap-2">
          {methods.map((method) => {
            const selected = method.id === selectedMethodId;

            return (
              <PressableScale
                key={method.id}
                onPress={() => onSelectMethodId(method.id)}
                scaleTo={0.98}
                accessibilityRole="radio"
                accessibilityState={{ selected }}>
                <View
                  className={cn(
                    'flex-row items-center gap-3 rounded-2xl border px-3.5 py-3',
                    selected ? 'border-primary bg-primary/8' : 'border-border/60 bg-background',
                  )}>
                  <PayoutMethodIcon type={method.type} size={28} />
                  <View className="min-w-0 flex-1 gap-0.5">
                    <Text className="text-foreground text-sm font-medium" numberOfLines={1}>
                      {formatPayoutMethodLabel(method)}
                    </Text>
                    <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                      {formatPayoutMethodSubtitle(method)}
                    </Text>
                  </View>
                  <View
                    className={cn(
                      'size-5 shrink-0 items-center justify-center rounded-full border-2',
                      selected ? 'border-primary' : 'border-muted-foreground/40',
                    )}>
                    {selected ? <View className="bg-primary size-2.5 rounded-full" /> : null}
                  </View>
                </View>
              </PressableScale>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
