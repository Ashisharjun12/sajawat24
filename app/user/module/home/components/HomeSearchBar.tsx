import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { Href, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { View } from 'react-native';

export function HomeSearchBar() {
  return (
    <ScalePressable
      onPress={() => router.push('/(app)/search' as Href)}
      haptic
      className="flex-row items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-3"
      accessibilityRole="button"
      accessibilityLabel="Search decorations">
      <Icon as={Search} className="text-muted-foreground size-5 shrink-0" />
      <Text className="text-muted-foreground flex-1 text-sm" numberOfLines={1}>
        Search decorations or occasions
      </Text>
    </ScalePressable>
  );
}
