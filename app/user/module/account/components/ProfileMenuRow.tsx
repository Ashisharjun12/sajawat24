import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

type ProfileMenuRowProps = {
  label: string;
  icon?: LucideIcon;
  iconSlot?: ReactNode;
  subtitle?: string;
  onPress: () => void;
  showChevron?: boolean;
  isLast?: boolean;
};

export function ProfileMenuRow({
  label,
  icon,
  iconSlot,
  subtitle,
  onPress,
  showChevron = true,
}: ProfileMenuRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-3.5 rounded-2xl py-3.5 active:bg-muted/50"
      accessibilityRole="button">
      <View className="size-10 items-center justify-center rounded-xl bg-muted/45">
        {iconSlot ?? (icon ? <Icon as={icon} className="text-foreground size-[19px]" /> : null)}
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-foreground text-[17px] font-medium leading-snug">{label}</Text>
        {subtitle ? (
          <Text className="text-muted-foreground mt-0.5 text-sm leading-snug">{subtitle}</Text>
        ) : null}
      </View>
      {showChevron ? (
        <Icon as={ChevronRight} className="text-muted-foreground/60 size-5 shrink-0" />
      ) : null}
    </Pressable>
  );
}
