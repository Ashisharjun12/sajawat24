import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';

type MenuRowProps = {
  label: string;
  icon: LucideIcon;
  onPress: () => void;
  className?: string;
};

export function MenuRow({ label, icon, onPress, className }: MenuRowProps) {
  return (
    <PressableScale
      onPress={onPress}
      className={cn('flex-row items-center justify-between py-3.5', className)}>
      <View className="flex-row items-center gap-3">
        <Icon as={icon} className="text-muted-foreground size-5" />
        <Text className="text-foreground text-base">{label}</Text>
      </View>
      <Icon as={ChevronRight} className="text-muted-foreground size-4" />
    </PressableScale>
  );
}
