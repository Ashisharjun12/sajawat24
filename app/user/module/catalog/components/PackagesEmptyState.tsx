import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { Heart, ShoppingBag } from 'lucide-react-native';
import { View } from 'react-native';

export type PackagesEmptyIcon = 'bag' | 'wishlist';

type PackagesEmptyStateProps = {
  title: string;
  description: string;
  buttonLabel?: string;
  icon?: PackagesEmptyIcon;
  onBrowse?: () => void;
};

function EmptyIconBadge({ icon }: { icon: PackagesEmptyIcon }) {
  const glyph = icon === 'wishlist' ? Heart : ShoppingBag;
  return (
    <View className="mb-4 size-14 items-center justify-center self-center rounded-full bg-primary/10">
      <Icon as={glyph} className="text-primary size-7" strokeWidth={2.25} />
    </View>
  );
}

export function PackagesEmptyState({
  title,
  description,
  buttonLabel = 'View packages',
  icon = 'bag',
  onBrowse,
}: PackagesEmptyStateProps) {
  function browse() {
    if (onBrowse) {
      onBrowse();
      return;
    }
    router.push('/(app)/category' as Href);
  }

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="w-full max-w-sm rounded-2xl border border-dashed border-border bg-muted/20 px-5 py-8">
        <EmptyIconBadge icon={icon} />
        <Text className="text-foreground text-center text-base font-semibold">{title}</Text>
        <Text className="text-muted-foreground mt-2 text-center text-sm leading-6">{description}</Text>
        <Button variant="primary" size="sm" className="mt-5 self-center" onPress={browse}>
          <Text>{buttonLabel}</Text>
        </Button>
      </View>
    </View>
  );
}
