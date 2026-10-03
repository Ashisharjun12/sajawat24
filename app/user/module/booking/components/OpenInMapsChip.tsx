import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { GOOGLE_MAPS_ICON_URL } from '@/module/booking/lib/map-external-icons';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { View } from 'react-native';

const MAPS_ICON_SIZE = 14;

type Props = {
  onPress: () => void;
  className?: string;
  label?: string;
};

/** Google Maps launcher — vendor parity (compact icon + label). */
export function OpenInMapsChip({ onPress, className, label = 'Open in Maps' }: Props) {
  return (
    <ScalePressable
      haptic
      onPress={onPress}
      accessibilityLabel={label}
      className={cn(
        'flex-row items-center gap-1 rounded-full border border-border bg-background/95 px-2.5 py-1.5 shadow-sm',
        className,
      )}>
      <Image
        source={GOOGLE_MAPS_ICON_URL}
        style={{ width: MAPS_ICON_SIZE, height: MAPS_ICON_SIZE }}
        contentFit="contain"
      />
      <Text className="text-foreground text-[11px] font-semibold">{label}</Text>
    </ScalePressable>
  );
}

export function MapExpandChip({
  onPress,
  className,
  children,
}: {
  onPress: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <ScalePressable
      haptic
      onPress={onPress}
      accessibilityLabel="Expand map"
      className={cn(
        'items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-sm',
        className,
      )}>
      <View>{children}</View>
    </ScalePressable>
  );
}
