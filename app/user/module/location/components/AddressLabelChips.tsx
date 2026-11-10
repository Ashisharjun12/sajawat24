import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Briefcase, Home, MapPin, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

export type AddressLabelChoice = 'home' | 'office' | 'other';

const OPTIONS: { value: AddressLabelChoice; label: string; icon: LucideIcon }[] = [
  { value: 'home', label: 'Home', icon: Home },
  { value: 'office', label: 'Office', icon: Briefcase },
  { value: 'other', label: 'Other', icon: MapPin },
];

/** Saved label for a chip. "Other" uses whatever the user typed. */
export function resolveAddressLabel(choice: AddressLabelChoice, custom: string): string {
  if (choice === 'home') return 'Home';
  if (choice === 'office') return 'Office';
  return custom.trim();
}

/** Existing label -> chip. Only exact Home / Office map to a chip; anything else stays as typed text. */
export function choiceFromLabel(label: string): { choice: AddressLabelChoice; custom: string } {
  const text = label.trim();
  if (!text || /^home$/i.test(text)) return { choice: 'home', custom: '' };
  if (/^office$/i.test(text)) return { choice: 'office', custom: '' };
  return { choice: 'other', custom: text };
}

type AddressLabelChipsProps = {
  value: AddressLabelChoice;
  onChange: (next: AddressLabelChoice) => void;
  disabled?: boolean;
};

/** Home / Office / Other selector. Tapping "Other" is the cue for the parent to show a text field. */
export function AddressLabelChips({ value, onChange, disabled }: AddressLabelChipsProps) {
  return (
    <View className="flex-row flex-wrap gap-2.5" accessibilityRole="radiogroup">
      {OPTIONS.map((option) => {
        const selected = value === option.value;
        return (
          <ScalePressable
            key={option.value}
            onPress={() => onChange(option.value)}
            disabled={disabled}
            haptic
            pressScale={0.96}
            className={cn(
              'h-11 flex-row items-center justify-center gap-2 rounded-xl border px-4',
              selected ? 'border-primary bg-primary-tint' : 'border-border bg-surface',
            )}
            accessibilityRole="radio"
            accessibilityState={{ selected, disabled: Boolean(disabled) }}
            accessibilityLabel={option.label}>
            <Icon
              as={option.icon}
              className={cn('size-[18px]', selected ? 'text-primary' : 'text-muted-foreground')}
            />
            <Text
              className={cn(
                'text-sm font-medium',
                selected ? 'text-primary font-semibold' : 'text-foreground',
              )}>
              {option.label}
            </Text>
          </ScalePressable>
        );
      })}
    </View>
  );
}
