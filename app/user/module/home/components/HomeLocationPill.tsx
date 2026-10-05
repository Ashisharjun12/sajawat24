import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { useLocationStore } from '@/store/location.store';
import { ChevronDown, MapPin } from 'lucide-react-native';

type HomeLocationPillProps = {
  onPress: () => void;
};

export function HomeLocationPill({ onPress }: HomeLocationPillProps) {
  const city = useLocationStore((s) => s.city);
  const label = city?.name?.trim() || 'Select city';

  return (
    <ScalePressable
      onPress={onPress}
      haptic
      className="max-w-[58%] flex-row items-center gap-1.5 rounded-pill border border-primary-foreground/25 bg-primary-dark/40 px-3 py-2"
      accessibilityRole="button"
      accessibilityLabel={city ? `City: ${city.name}. Change city` : 'Select city'}>
      <Icon as={MapPin} className="size-4 shrink-0 text-primary-foreground" strokeWidth={2.25} />
      <Text
        className="text-primary-foreground min-w-0 shrink text-sm font-semibold"
        numberOfLines={1}>
        {label}
      </Text>
      <Icon
        as={ChevronDown}
        className="size-3.5 shrink-0 text-primary-foreground/90"
        strokeWidth={2.5}
      />
    </ScalePressable>
  );
}
