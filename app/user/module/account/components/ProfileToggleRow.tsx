import { Icon } from '@/components/ui/icon';
import { Switch } from '@/components/ui/switch';
import { Text } from '@/components/ui/text';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

type ProfileToggleRowProps = {
  label: string;
  icon: LucideIcon;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  isLast?: boolean;
};

export function ProfileToggleRow({
  label,
  icon,
  value,
  onValueChange,
  disabled = false,
}: ProfileToggleRowProps) {
  return (
    <View className="flex-row items-center gap-3.5 rounded-2xl py-3.5">
      <View className="size-10 items-center justify-center rounded-xl bg-muted/45">
        <Icon as={icon} className="text-foreground size-[19px]" />
      </View>
      <Text className="text-foreground min-w-0 flex-1 text-[17px] font-medium">{label}</Text>
      <Switch checked={value} onCheckedChange={onValueChange} disabled={disabled} />
    </View>
  );
}
