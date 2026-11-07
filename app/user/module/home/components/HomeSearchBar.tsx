import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { ScalePressable } from '@/components/shell';
import { useSearchTypingHint } from '@/module/home/hooks/use-search-typing-hint';
import { Href, router } from 'expo-router';
import { Search } from 'lucide-react-native';
import { View } from 'react-native';

/** Fixed sizes so the typing animation never changes the bar's height. */
const BAR_HEIGHT = 48;
const LINE_HEIGHT = 20;
const textStyle = { lineHeight: LINE_HEIGHT, height: LINE_HEIGHT, includeFontPadding: false } as const;

export function HomeSearchBar() {
  const suffix = useSearchTypingHint();

  return (
    <ScalePressable
      onPress={() => router.push('/(app)/search' as Href)}
      haptic
      style={{ height: BAR_HEIGHT }}
      className="flex-row items-center gap-2.5 rounded-xl border border-black/10 bg-card px-3.5 shadow-raised"
      accessibilityRole="button"
      accessibilityLabel="Search">
      <Icon as={Search} className="size-5 shrink-0 text-primary" strokeWidth={2.25} />
      <View className="min-w-0 flex-1 flex-row items-center" style={{ height: LINE_HEIGHT }}>
        <Text className="text-muted-foreground text-sm" style={textStyle} numberOfLines={1}>
          Search{' '}
        </Text>
        <Text
          className="text-muted-foreground/90 min-w-0 flex-1 text-sm"
          style={textStyle}
          numberOfLines={1}>
          {/* Zero-width space keeps the line from collapsing while the hint is empty. */}
          {suffix || '\u200B'}
        </Text>
        <Text
          className="text-muted-foreground/70 text-sm"
          style={textStyle}
          accessibilityElementsHidden>
          |
        </Text>
      </View>
    </ScalePressable>
  );
}
