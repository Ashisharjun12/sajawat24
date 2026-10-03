import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { SELECT_LOCATION_HREF } from '@/lib/select-location-route';
import { Href, router } from 'expo-router';
import { View } from 'react-native';

type ProductDetailErrorProps = {
  message: string;
  onBack: () => void;
  onRetry?: () => void;
};

export function ProductDetailError({ message, onBack, onRetry }: ProductDetailErrorProps) {
  return (
    <View className="mx-5 mt-24 gap-4 rounded-2xl border border-border bg-card p-6">
      <Text className="text-foreground text-2xl font-semibold">Couldn&apos;t load this setup</Text>
      <Text className="text-muted-foreground text-sm leading-relaxed">{message}</Text>
      <View className="flex-row flex-wrap gap-2">
        {onRetry ? (
          <Button variant="default" onPress={onRetry}>
            <Text>Try again</Text>
          </Button>
        ) : null}
        <Button variant="outline" onPress={() => router.push(SELECT_LOCATION_HREF as Href)}>
          <Text>Change location</Text>
        </Button>
        <Button variant="outline" onPress={onBack}>
          <Text>Go back</Text>
        </Button>
      </View>
    </View>
  );
}
