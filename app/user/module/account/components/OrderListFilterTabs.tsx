import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import {
  ORDER_LIST_BUCKETS,
  type OrderListBucket,
} from '@/module/account/lib/booking-ui';
import { Pressable, ScrollView, View } from 'react-native';

type OrderListFilterTabsProps = {
  bucket: OrderListBucket;
  onBucketChange: (bucket: OrderListBucket) => void;
};

export function OrderListFilterTabs({ bucket, onBucketChange }: OrderListFilterTabsProps) {
  return (
    <View className="-mx-1 mt-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-1 pb-1">
        {ORDER_LIST_BUCKETS.map((item) => {
          const selected = item.value === bucket;
          return (
            <Pressable
              key={item.value}
              onPress={() => onBucketChange(item.value)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              className={cn(
                'rounded-full border px-4 py-2 active:opacity-90',
                selected
                  ? 'border-primary bg-primary'
                  : 'border-border bg-muted/40',
              )}>
              <Text
                className={cn(
                  'text-sm font-semibold',
                  selected ? 'text-primary-foreground' : 'text-muted-foreground',
                )}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
