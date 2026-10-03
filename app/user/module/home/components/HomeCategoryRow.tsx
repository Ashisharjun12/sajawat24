import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { Baby, Cake, Heart, Home, Sparkles, type LucideIcon } from 'lucide-react-native';
import { ScalePressable } from '@/components/shell';
import { ScrollView, View } from 'react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  cake: Cake,
  heart: Heart,
  baby: Baby,
  home: Home,
  sparkles: Sparkles,
};

type HomeCategoryRowProps = {
  categories: HomeCategory[];
  onCategoryPress?: (category: HomeCategory) => void;
};

export function HomeCategoryRow({ categories, onCategoryPress }: HomeCategoryRowProps) {
  if (!categories.length) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-3 px-4 py-2">
      {categories.map((category) => {
        const Lucide = ICON_MAP[category.iconKey ?? 'sparkles'] ?? Sparkles;
        return (
          <ScalePressable
            key={category.id}
            onPress={() => onCategoryPress?.(category)}
            haptic
            pressScale={0.94}
            className="w-[72px] items-center gap-2"
            accessibilityRole="button"
            accessibilityLabel={category.name}>
            <View className="bg-primary/15 flex size-14 items-center justify-center rounded-2xl">
              <Icon as={Lucide} className="text-primary size-7" />
            </View>
            <Text className="text-foreground text-center text-xs font-medium" numberOfLines={2}>
              {category.name}
            </Text>
          </ScalePressable>
        );
      })}
    </ScrollView>
  );
}
