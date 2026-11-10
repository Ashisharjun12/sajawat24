import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { categoryImageUrl, type HomeCategory } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

type HomeCategoryTileProps = {
  category: HomeCategory;
  onPress: () => void;
};

export function HomeCategoryTile({ category, onPress }: HomeCategoryTileProps) {
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
          <View className="bg-muted h-full w-full items-center justify-center px-1.5">
            <Text
              className="text-muted-foreground text-sm font-semibold tracking-tight"
              numberOfLines={1}
              adjustsFontSizeToFit
              accessibilityLabel="No image">
              sajawat24
            </Text>
          </View>
        )}
      </View>
      <Text className="text-foreground w-full text-center text-[11px] font-medium leading-tight" numberOfLines={2}>
        {category.name}
      </Text>
    </ScalePressable>
  );
}
