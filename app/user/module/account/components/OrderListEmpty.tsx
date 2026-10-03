import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import {
  ORDER_LIST_EMPTY_COPY,
  type OrderListBucket,
} from '@/module/account/lib/booking-ui';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { View } from 'react-native';

type OrderListEmptyProps = {
  bucket: OrderListBucket;
};

export function OrderListEmpty({ bucket }: OrderListEmptyProps) {
  const copy = ORDER_LIST_EMPTY_COPY[bucket];
  return (
    <View className="rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-10">
      <Text className="text-foreground text-center text-base font-semibold">{copy.title}</Text>
      <Text className="text-muted-foreground mt-2 text-center text-sm leading-6">{copy.body}</Text>
      <Button
        className="mt-6 self-center rounded-full px-6"
        onPress={() => router.push('/(app)/category' as Href)}>
        <Text>Browse decorations</Text>
      </Button>
    </View>
  );
}
