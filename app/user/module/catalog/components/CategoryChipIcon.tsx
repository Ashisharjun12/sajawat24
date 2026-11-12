import { Icon } from '@/components/ui/icon';
import { resolveCategoryIcon } from '@/lib/category-icons';
import { cn } from '@/lib/utils';
import type { HomeCategory } from '@/module/home/lib/home-catalog';
import { Image } from 'expo-image';
import { View } from 'react-native';

/**
 * 28px category icon used inside the browse chips (Explore + Category tabs).
 * Uploaded icons keep their own colours: no tone behind them, and a white circle when the chip
 * is selected (teal) so the artwork stays visible.
 */
export function CategoryChipIcon({ category, active }: { category: HomeCategory; active: boolean }) {
  const { Icon: CategoryIcon, toneBg, toneIcon, iconUrl } = resolveCategoryIcon({
    iconKey: category.iconKey,
    iconTone: category.iconTone,
    iconUrl: category.iconUrl,
    slug: category.slug,
  });

  if (iconUrl) {
    const size = active ? 24 : 28;
    return (
      <View
        className={cn(
          'size-7 items-center justify-center overflow-hidden rounded-full',
          active && 'bg-primary-foreground',
        )}>
        <Image
          source={{ uri: iconUrl }}
          style={{ width: size, height: size }}
          contentFit="contain"
          accessible={false}
        />
      </View>
    );
  }

  return (
    <View
      className={cn(
        'flex size-7 items-center justify-center rounded-full',
        active ? 'bg-primary-foreground/15' : toneBg,
      )}>
      <Icon
        as={CategoryIcon}
        className={cn('size-3.5', active ? 'text-primary-foreground' : toneIcon)}
      />
    </View>
  );
}
