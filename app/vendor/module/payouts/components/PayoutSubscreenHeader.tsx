import { PressableScale } from '@/components/motion';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { type Href, router } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { View } from 'react-native';

type PayoutSubscreenHeaderProps = {
  title: string;
  subtitle?: string;
  backHref: Href;
};

export function PayoutSubscreenHeader({ title, subtitle, backHref }: PayoutSubscreenHeaderProps) {
  return (
    <View className="gap-1 px-1">
      <View className="flex-row items-center gap-3">
        <PressableScale
          onPress={() => router.replace(backHref)}
          className="-ml-1"
          accessibilityLabel="Go back"
          scaleTo={0.92}>
          <View className="size-10 items-center justify-center">
            <Icon as={ArrowLeft} className="text-foreground size-5" />
          </View>
        </PressableScale>
        <Text className="text-foreground text-2xl font-bold">{title}</Text>
      </View>
      {subtitle ? <Text className="text-muted-foreground text-sm">{subtitle}</Text> : null}
    </View>
  );
}
