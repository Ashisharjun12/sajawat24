import { PressableScale } from '@/components/motion';
import { Text } from '@/components/ui/text';
import { GOOGLE_MAPS_ICON_URL } from '@/module/bookings/lib/map-external-icons';
import { cn } from '@/lib/utils';
import { Image } from 'expo-image';
import { type ReactNode } from 'react';
import { View } from 'react-native';

type Props = {
  onPress: () => void;
  className?: string;
  label?: string;
};

export function OpenInMapsChip({ onPress, className, label = 'Open in Maps' }: Props) {
  return (
    <PressableScale
      onPress={onPress}
      accessibilityLabel={label}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border border-border bg-background/95 px-3 py-2 shadow-sm',
        className,
      )}>
      <Image source={GOOGLE_MAPS_ICON_URL} style={{ width: 18, height: 18 }} contentFit="contain" />
      <Text className="text-foreground text-xs font-semibold">{label}</Text>
    </PressableScale>
  );
}

/** Compact expand control (icon only). */
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
    <PressableScale
      onPress={onPress}
      accessibilityLabel="Expand map"
      className={cn(
        'items-center justify-center rounded-full border border-border bg-background/95 p-2 shadow-sm',
        className,
      )}>
      <View>{children}</View>
    </PressableScale>
  );
}
