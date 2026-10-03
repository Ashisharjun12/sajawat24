import { ScreenBackButton } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { View } from 'react-native';

type LocationStackHeaderProps = {
  title: string;
  onBack: () => void;
};

export function LocationStackHeader({ title, onBack }: LocationStackHeaderProps) {
  return (
    <View className="flex-row items-center border-b border-border px-2 py-2">
      <ScreenBackButton
        onPress={onBack}
        className="bg-transparent active:bg-muted/60"
        iconClassName="text-foreground size-7"
      />
      <Text className="text-foreground flex-1 text-center text-lg font-semibold">{title}</Text>
      <View className="size-10" />
    </View>
  );
}
