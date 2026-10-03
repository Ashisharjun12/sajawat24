import { Text } from '@/components/ui/text';
import { View } from 'react-native';

export function AuthOrDivider() {
  return (
    <View className="my-1 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-border" />
      <Text className="text-muted-foreground text-xs font-medium uppercase tracking-wide">or</Text>
      <View className="h-px flex-1 bg-border" />
    </View>
  );
}
