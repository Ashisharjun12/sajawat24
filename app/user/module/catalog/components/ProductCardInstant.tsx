import { Text } from '@/components/ui/text';
import { formatInstantCardEta } from '@/module/catalog/lib/instant-card-copy';
import type { HomeProductInstant } from '@/module/home/lib/home-catalog';
import { Clock } from 'lucide-react-native';
import { View } from 'react-native';

type ProductCardInstantBadgeProps = {
  instant?: HomeProductInstant | null;
};

export function ProductCardInstantBadge({ instant }: ProductCardInstantBadgeProps) {
  if (!instant?.enabled || !instant.showBadge) return null;
  const label = (instant.badgeLabel || 'Instant').trim() || 'Instant';
  return (
    <View className="absolute left-2 top-2 z-10 max-w-[85%] rounded-md bg-orange-500 px-2 py-0.5 shadow-sm">
      <Text className="text-[10px] font-bold text-white" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

type ProductCardInstantEtaProps = {
  instant?: HomeProductInstant | null;
};

export function ProductCardInstantEta({ instant }: ProductCardInstantEtaProps) {
  if (!instant?.enabled) return null;
  const eta = formatInstantCardEta(instant.etaMinutes);
  if (!eta) return null;

  return (
    <View className="flex shrink-0 flex-row items-center gap-1.5">
      <View className="size-[18px] items-center justify-center rounded-full bg-blue-600/15">
        <Clock size={11} color="#2563EB" strokeWidth={2.25} />
      </View>
      <Text className="text-foreground text-[11px] font-medium tabular-nums leading-none">
        {eta}
      </Text>
    </View>
  );
}
