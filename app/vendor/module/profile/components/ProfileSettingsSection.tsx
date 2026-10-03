import { PressableScale } from '@/components/motion';
import { MenuRow } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { ChevronRight } from 'lucide-react-native';
import { View } from 'react-native';

export type ProfileSettingsItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  value?: string;
  onPress: () => void;
};

type ProfileSettingsSectionProps = {
  title?: string;
  items: ProfileSettingsItem[];
};

function SettingsDivider() {
  return <View className="h-px bg-border/40" />;
}

export function ProfileSettingsSection({ title = 'Settings', items }: ProfileSettingsSectionProps) {
  return (
    <View className="gap-2 px-1">
      <Text className="text-foreground pt-2 text-base font-bold">{title}</Text>
      <View>
        {items.map((item, index) => (
          <View key={item.id}>
            {item.value ? (
              <PressableScale
                onPress={item.onPress}
                className="flex-row items-center justify-between py-3.5">
                <View className="flex-row items-center gap-3">
                  <Icon as={item.icon} className="text-muted-foreground size-5" />
                  <Text className="text-foreground text-base">{item.label}</Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-muted-foreground text-sm">{item.value}</Text>
                  <Icon as={ChevronRight} className="text-muted-foreground size-4" />
                </View>
              </PressableScale>
            ) : (
              <MenuRow label={item.label} icon={item.icon} onPress={item.onPress} />
            )}
            {index < items.length - 1 ? <SettingsDivider /> : null}
          </View>
        ))}
      </View>
    </View>
  );
}
