import { PressableScale } from '@/components/motion';
import { triggerHaptic } from '@/components/motion/haptics';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { Copy } from 'lucide-react-native';
import { View } from 'react-native';

type Props = {
  icon: LucideIcon;
  title: string;
  value?: string;
  disabled?: boolean;
  onPress: () => void;
  onCopy?: () => void;
};

export function HelpContactCard({
  icon,
  title,
  value,
  disabled,
  onPress,
  onCopy,
}: Props) {
  return (
    <PressableScale
      disabled={disabled}
      onPress={() => {
        if (disabled) return;
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      className="flex-row items-center justify-between py-3.5">
      <View className="min-w-0 flex-1 flex-row items-center gap-3">
        <Icon as={icon} className="text-muted-foreground size-5" />
        <View className="min-w-0 flex-1">
          <Text className="text-foreground text-base">{title}</Text>
          {value ? (
            <Text className="text-muted-foreground mt-0.5 text-sm" numberOfLines={1}>
              {value}
            </Text>
          ) : null}
        </View>
      </View>
      {onCopy ? (
        <PressableScale
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            onCopy();
          }}
          hitSlop={8}
          className="ml-2 p-2">
          <Icon as={Copy} className="text-muted-foreground size-4" />
        </PressableScale>
      ) : null}
    </PressableScale>
  );
}
