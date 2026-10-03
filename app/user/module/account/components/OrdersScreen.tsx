import { getApiError } from '@/api/client';
import type { OrderListBucket } from '@/api/orders.api';
import { Screen, TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGoBack } from '@/lib/use-go-back';
import { OrderListCard } from '@/module/account/components/OrderListCard';
import { OrderListEmpty } from '@/module/account/components/OrderListEmpty';
import { OrderListFilterTabs } from '@/module/account/components/OrderListFilterTabs';
import { OrderListSkeleton } from '@/module/account/components/OrderListSkeleton';
import { useOrdersInfiniteQuery } from '@/module/account/hooks/use-orders-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from 'react-native';

export function OrdersScreen() {
  const onBack = useGoBack();
  const [bucket, setBucket] = useState<OrderListBucket>('all');
  const {
    data,
    isLoading,
    isError,
    error,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useOrdersInfiniteQuery(bucket);

  const orders = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data],
  );

  const showInitialLoading = isLoading && !data;

  return (
    <Screen edges={['top', 'left', 'right']} gutter scroll={false} contentClassName="pb-4">
      <TabScreenTitle
        title="My orders"
        showBack
        onBack={onBack}
        insetFromParentGutter
      />
      <OrderListFilterTabs bucket={bucket} onBucketChange={setBucket} />

      {showInitialLoading ? (
        <View className="mt-4">
          <OrderListSkeleton />
        </View>
      ) : isError ? (
        <Text className="text-destructive mt-4 text-sm">{getApiError(error)}</Text>
      ) : (
        <FlatList
          className="mt-4 flex-1"
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={() => void refetch()} />
          }
          ListEmptyComponent={<OrderListEmpty bucket={bucket} />}
          renderItem={({ item }) => <OrderListCard order={item} />}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
          }}
          onEndReachedThreshold={0.35}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator className="py-4" />
            ) : hasNextPage ? (
              <Button
                variant="outline"
                className="mt-2 self-center rounded-full"
                onPress={() => void fetchNextPage()}>
                <Text>Load more</Text>
              </Button>
            ) : null
          }
        />
      )}
    </Screen>
  );
}
