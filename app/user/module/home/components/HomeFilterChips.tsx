import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { Href, router } from 'expo-router';
import { Pressable, ScrollView } from 'react-native';

const CHIPS = [
  { id: 'instant', label: 'Instant', href: '/(app)/instant' as Href },
  { id: 'offers', label: 'Offers', href: '/(app)/explore' as Href },
  { id: 'budget', label: 'Under ₹5k', href: '/(app)/explore' as Href },
];

type HomeFilterChipsProps = {
  activeId?: string;
};

export function HomeFilterChips({ activeId }: HomeFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4 pb-2">
      {CHIPS.map((chip) => {
        const active = activeId === chip.id;
        return (
          <Pressable
            key={chip.id}
            onPress={() => router.push(chip.href)}
            className={cn(
              'rounded-full border px-4 py-2',
              active ? 'border-primary bg-primary/15' : 'border-border bg-background',
            )}
            accessibilityRole="button">
            <Text
              className={cn(
                'text-sm font-medium',
                active ? 'text-foreground' : 'text-muted-foreground',
              )}>
              {chip.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
