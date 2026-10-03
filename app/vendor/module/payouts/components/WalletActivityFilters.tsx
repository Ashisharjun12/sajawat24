import { PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { WalletActivityDatePreset } from '@/module/payouts/lib/wallet-activity-date';
import { ScrollView, View } from 'react-native';

type WalletActivityTab = 'earnings' | 'cod' | 'withdrawals';

type FilterPillProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterPill({ label, active, onPress }: FilterPillProps) {
  return (
    <PressableScale
      onPress={() => {
        triggerHaptic();
        onPress();
      }}
      className={cn('rounded-full px-4 py-2.5', active ? 'bg-primary' : 'bg-muted')}>
      <Text
        className={cn(
          'text-sm font-medium',
          active ? 'text-primary-foreground' : 'text-muted-foreground',
        )}>
        {label}
      </Text>
    </PressableScale>
  );
}

function FilterDivider() {
  return <View className="mx-1 h-6 w-px bg-border/60" />;
}

type WalletActivityFiltersProps = {
  tab: WalletActivityTab;
  onTabChange: (tab: WalletActivityTab) => void;
  datePreset: WalletActivityDatePreset;
  onDatePresetChange: (preset: WalletActivityDatePreset) => void;
};

export function WalletActivityFilters({
  tab,
  onTabChange,
  datePreset,
  onDatePresetChange,
}: WalletActivityFiltersProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      nestedScrollEnabled
      contentContainerClassName="items-center gap-2 pr-1">
      <FilterPill
        label="Earnings"
        active={tab === 'earnings'}
        onPress={() => onTabChange('earnings')}
      />
      <FilterPill label="COD" active={tab === 'cod'} onPress={() => onTabChange('cod')} />
      <FilterPill
        label="Withdrawals"
        active={tab === 'withdrawals'}
        onPress={() => onTabChange('withdrawals')}
      />

      <FilterDivider />

      <FilterPill
        label="30 days"
        active={datePreset === '30d'}
        onPress={() => onDatePresetChange('30d')}
      />
      <FilterPill
        label="90 days"
        active={datePreset === '90d'}
        onPress={() => onDatePresetChange('90d')}
      />
      <FilterPill
        label="All time"
        active={datePreset === 'all'}
        onPress={() => onDatePresetChange('all')}
      />
      <FilterPill
        label="Custom"
        active={datePreset === 'custom'}
        onPress={() => onDatePresetChange('custom')}
      />
    </ScrollView>
  );
}
