import { ScalePressable } from '@/components/shell';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { categoryImageUrl, type HomeCategory } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { Baby, Cake, Heart, Home, Sparkles, type LucideIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  cake: Cake,
  heart: Heart,
  baby: Baby,
  home: Home,
  sparkles: Sparkles,
};

const CATEGORY_PLACEHOLDER =
  'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=400&fit=crop';

type HomeCategoryTileProps = {
  category: HomeCategory;
  onPress: () => void;
};

export function HomeCategoryTile({ category, onPress }: HomeCategoryTileProps) {
  const Lucide = ICON_MAP[category.iconKey ?? 'sparkles'] ?? Sparkles;
  const remoteUri = categoryImageUrl(category)?.trim() || null;
  const [remoteFailed, setRemoteFailed] = useState(false);

  useEffect(() => {
    setRemoteFailed(false);
  }, [category.id, remoteUri]);

  const showRemote = Boolean(remoteUri) && !remoteFailed;

  return (
    <ScalePressable
      onPress={onPress}
      haptic
      pressScale={0.94}
      className="min-w-0 flex-1 items-center gap-2 px-0.5"
      accessibilityRole="button"
      accessibilityLabel={category.name}>
      <View className="bg-muted/40 w-full overflow-hidden rounded-2xl" style={{ aspectRatio: 1 }}>
        {showRemote ? (
          <Image
            source={{ uri: remoteUri! }}
            style={{ width: '100%', height: '100%' }}
            contentFit="cover"
            accessibilityLabel={category.name}
            onError={() => setRemoteFailed(true)}
          />
        ) : (
          <View className="h-full w-full">
            <Image
              source={{ uri: CATEGORY_PLACEHOLDER }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              accessibilityLabel=""
            />
            <View className="absolute inset-0 items-center justify-center bg-black/25">
              <View className="items-center justify-center rounded-full bg-background/90 p-2.5">
                <Icon as={Lucide} className="text-primary size-7" />
              </View>
            </View>
          </View>
        )}
      </View>
      <Text className="text-foreground w-full text-center text-[11px] font-medium leading-tight" numberOfLines={2}>
        {category.name}
      </Text>
    </ScalePressable>
  );
}
