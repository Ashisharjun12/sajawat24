import { Screen, SmoothScrollView, TabScreenTitle } from '@/components/shell';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useGoBack } from '@/lib/use-go-back';
import { CatalogProductCard } from '@/module/catalog/components/CatalogProductCard';
import { useWishlistStore } from '@/store/wishlist.store';
import { useLocationStore } from '@/store/location.store';
import { useAuthStore } from '@/store/auth.store';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, View } from 'react-native';

function unavailableLabel(reason?: string) {
  if (reason === 'inactive') return 'This package is no longer available';
  if (reason === 'no_price') return 'Pricing unavailable in your area';
  return 'Not available in your city';
}

export function WishlistScreen() {
  const onBack = useGoBack({ orHome: true });
  const rows = useWishlistStore((s) => s.rows);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const refresh = useWishlistStore((s) => s.refresh);
  const removeUnavailable = useWishlistStore((s) => s.removeUnavailable);
  const status = useWishlistStore((s) => s.status);
  const cityId = useLocationStore((s) => s.serviceCityId());
  const pincode = useLocationStore((s) => s.pincodeCode());
  const accessToken = useAuthStore((s) => s.accessToken);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!accessToken) return;
    if (!cityId && !pincode) return;
    void refresh();
  }, [accessToken, cityId, pincode, refresh]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  return (
    <Screen scroll={false} edges={['left', 'right']} contentClassName="flex-1 bg-bg">
      <TabScreenTitle title="Wishlist" tone="primary" showBack onBack={onBack} />
      <SmoothScrollView
        className="flex-1 bg-bg"
        contentContainerClassName="gap-4 p-4"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}>
        {rows.length === 0 && status !== 'loading' ? (
          <View className="items-center px-6 py-16">
            <Text className="text-foreground text-center text-base font-semibold">
              No saved setups yet
            </Text>
            <Text className="text-muted-foreground mt-2 text-center text-sm leading-relaxed">
              Tap the heart on any package to save it here.
            </Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {rows.map((row) => {
              if (row.available && row.product) {
                return (
                  <View key={row.productId} className="w-[48%]">
                    <CatalogProductCard product={row.product} layout="grid" />
                  </View>
                );
              }
              return (
                <View
                  key={row.productId}
                  className="w-[48%] rounded-card border border-border/60 bg-card p-3 opacity-80">
                  <Text className="text-foreground text-sm font-semibold" numberOfLines={2}>
                    {row.product?.title ?? 'Saved package'}
                  </Text>
                  <Text className="text-muted-foreground mt-2 text-xs leading-relaxed">
                    {unavailableLabel(row.unavailableReason)}
                  </Text>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onPress={() => void removeUnavailable(row.productId)}>
                    Remove
                  </Button>
                </View>
              );
            })}
          </View>
        )}
      </SmoothScrollView>
    </Screen>
  );
}
