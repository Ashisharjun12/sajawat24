import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { Href, router } from 'expo-router';
import { Search } from 'lucide-react-native';

export function HomeSearchBar() {
  return (
    <ScalePressable
      onPress={() => router.push('/(app)/search' as Href)}
      haptic
      className="flex-row items-center gap-2.5 rounded-xl border border-black/10 bg-card px-3.5 py-3 shadow-raised"
      accessibilityRole="button"
      accessibilityLabel="Search decorations">
      <Icon as={Search} className="size-5 shrink-0 text-primary" strokeWidth={2.25} />
      <Text className="text-muted-foreground flex-1 text-sm" numberOfLines={1}>
        Search decorations or occasions
      </Text>
    </ScalePressable>
  );
}
