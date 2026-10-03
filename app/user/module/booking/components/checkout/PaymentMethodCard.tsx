import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type PaymentMethodCardProps = {
  label: string;
  iconUri?: string;
  icon?: LucideIcon;
  selected: boolean;
  onSelect: () => void;
  disabled?: boolean;
  subtitle?: string;
  iconContainerClassName?: string;
  iconClassName?: string;
};

export function PaymentMethodCard({
  label,
  iconUri,
  icon,
  selected,
  onSelect,
  disabled,
  subtitle,
  iconContainerClassName,
  iconClassName,
}: PaymentMethodCardProps) {
  return (
    <ScalePressable
      haptic
      disabled={disabled}
      onPress={onSelect}
      accessibilityRole="radio"
      accessibilityState={{ selected, disabled: Boolean(disabled) }}
      className={cn(
        'flex-row items-center gap-3 rounded-2xl border bg-card px-4 py-3.5',
        selected ? 'border-primary bg-primary/5' : 'border-border',
        disabled && 'opacity-50',
      )}>
      <View
        className={cn(
          'size-11 items-center justify-center overflow-hidden rounded-xl bg-muted/50',
          iconContainerClassName,
        )}>
        {iconUri ? (
          <Image source={{ uri: iconUri }} className="size-9" contentFit="contain" />
        ) : icon ? (
          <Icon as={icon} className={cn('size-6 text-foreground', iconClassName)} />
        ) : null}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-base font-semibold">{label}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground mt-0.5 text-sm">{subtitle}</Text>
        ) : null}
      </View>
    </ScalePressable>
  );
}
