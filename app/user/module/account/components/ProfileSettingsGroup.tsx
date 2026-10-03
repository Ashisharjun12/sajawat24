import { Text } from '@/components/ui/text';
import type { ReactNode } from 'react';
import { View } from 'react-native';

type ProfileSettingsGroupProps = {
  title?: string;
  children: ReactNode;
};

export function ProfileSettingsGroup({ title, children }: ProfileSettingsGroupProps) {
  return (
    <View className="gap-2">
      {title ? (
        <Text className="text-muted-foreground text-[13px] font-medium tracking-wide">{title}</Text>
      ) : null}
      <View className="gap-0.5">{children}</View>
    </View>
  );
}
