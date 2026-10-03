import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { ScalePressable } from '@/components/shell';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type AccountInfoRowProps = {
  label: string;
  value: string;
  action?: ReactNode;
  onActionPress?: () => void;
  actionLabel?: string;
  isLast?: boolean;
};

export function AccountInfoRow({
  label,
  value,
  action,
  onActionPress,
  actionLabel,
  isLast = false,
}: AccountInfoRowProps) {
  const trailing =
    action ??
    (onActionPress && actionLabel ? (
      <ScalePressable onPress={onActionPress} haptic hitSlop={8}>
        <Text className="text-foreground text-sm font-medium underline">{actionLabel}</Text>
      </ScalePressable>
    ) : null);

  return (
    <View
      className={cn(
        'flex-row items-start justify-between gap-4 py-4',
        !isLast && 'border-b border-border',
      )}>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-sm font-semibold">{label}</Text>
        <Text className="text-muted-foreground mt-1 text-sm leading-snug">{value}</Text>
      </View>
      {trailing ? <View className="shrink-0 pt-0.5">{trailing}</View> : null}
    </View>
  );
}
