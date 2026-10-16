import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { useSearchTypingHint } from '@/module/home/hooks/use-search-typing-hint';
import { Href, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { View } from 'react-native';

export function HomeSearchBar() {
  const suffix = useSearchTypingHint();

  return (
    <ScalePressable
      onPress={() => router.push('/(app)/search' as Href)}
      haptic
      className="flex-row items-center gap-2.5 rounded-xl border border-black/10 bg-card px-3.5 py-3 shadow-raised"
      accessibilityRole="button"
      accessibilityLabel="Search">
      <Icon as={Search} className="size-5 shrink-0 text-primary" strokeWidth={2.25} />
      <View className="min-w-0 flex-1 flex-row items-center">
        <Text className="text-muted-foreground text-sm" numberOfLines={1}>
          Search{' '}
        </Text>
        <Text className="text-muted-foreground/90 min-w-0 flex-1 text-sm" numberOfLines={1}>
          {suffix}
        </Text>
        <Text className="text-muted-foreground/70 text-sm" accessibilityElementsHidden>
          |
        </Text>
      </View>
    </ScalePressable>
  );
}
