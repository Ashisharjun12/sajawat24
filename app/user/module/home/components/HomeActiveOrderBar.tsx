import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import type { PublicOrderSummary } from '@/api/orders.api';
import { lightImpact } from '@/lib/light-haptic';
import { homeActiveOrderTitle } from '@/module/account/lib/active-order';
import { useActiveOrderForHome } from '@/module/account/hooks/use-active-order-for-home';
import { type Href, router } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { ACTIVE_ORDER_TRUCK_ICON_URL } from '@/lib/map-assets';
import { Image } from 'expo-image';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  type LayoutChangeEvent,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  View,
} from 'react-native';

/** Reserve scroll space so feed content clears the docked bar (px). */
export const HOME_ACTIVE_ORDER_BAR_HEIGHT = 72;

/** Time each booking stays on screen before the bar slides to the next one. */
const AUTOPLAY_MS = 4000;

type Props = {
  enabled?: boolean;
};

function openOrder(orderId: string) {
  lightImpact();
  router.push(`/(app)/profile/orders/${orderId}` as Href);
}

function ActiveOrderCard({
  order,
  width,
  position,
  total,
}: {
  order: PublicOrderSummary;
  width?: number;
  position: number;
  total: number;
}) {
  const title = homeActiveOrderTitle(order.status);
  // With one booking, keep the original copy. With several, name the booking so the
  // slides are distinguishable, plus "1 of 2" so customers know there are more.
  const subtitle =
    total > 1
      ? `${order.primaryName || 'Your booking'} · ${position} of ${total}`
      : 'Track live progress on your order';

  return (
    <ScalePressable
      haptic
      onPress={() => openOrder(order.id)}
      className="active:opacity-95"
      style={width ? { width } : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}. View details`}>
      <View className="flex-row items-center gap-3 px-4 py-3">
        <Image
          source={ACTIVE_ORDER_TRUCK_ICON_URL}
          style={{ width: 40, height: 40 }}
          contentFit="contain"
          accessibilityIgnoresInvertColors
        />
        <View className="min-w-0 flex-1">
          <Text className="text-body font-medium" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-muted-foreground text-caption" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
        <View className="flex-row items-center gap-0.5">
          <Text className="text-primary text-caption font-semibold">View details</Text>
          <Icon as={ChevronRight} className="text-primary size-4" />
        </View>
      </View>
    </ScalePressable>
  );
}

/**
 * Docked "your order" bar. One booking shows a single card; two or more slide
 * horizontally on their own (and can be swiped), with dots showing which one is visible.
 */
export function HomeActiveOrderBar({ enabled = true }: Props) {
  const { activeOrders } = useActiveOrderForHome(enabled);
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<FlatList<PublicOrderSummary>>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const count = activeOrders.length;
  const sliding = count > 1;

  // Bookings can finish while the bar is open; keep the index inside the list.
  useEffect(() => {
    if (index >= count && count > 0) {
      setIndex(0);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [count, index]);

  useEffect(() => {
    if (!sliding || paused || width === 0) return undefined;
    const id = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % count;
        listRef.current?.scrollToOffset({ offset: next * width, animated: true });
        return next;
      });
    }, AUTOPLAY_MS);
    return () => clearInterval(id);
  }, [sliding, paused, width, count]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  // A swipe pauses autoplay, then it resumes after one interval of no touching.
  const pauseAutoplay = useCallback(() => {
    setPaused(true);
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => setPaused(false), AUTOPLAY_MS);
  }, []);

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (width === 0) return;
      setIndex(Math.round(e.nativeEvent.contentOffset.x / width));
    },
    [width],
  );

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    setWidth(Math.round(e.nativeEvent.layout.width));
  }, []);

  if (count === 0) return null;

  const renderItem: ListRenderItem<PublicOrderSummary> = ({ item, index: itemIndex }) => (
    <ActiveOrderCard order={item} width={width} position={itemIndex + 1} total={count} />
  );

  return (
    <View
      className="overflow-hidden rounded-t-card border-t border-border bg-surface shadow-raised"
      onLayout={onLayout}>
      {sliding ? (
        width > 0 ? (
          <FlatList
            ref={listRef}
            data={activeOrders}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScrollBeginDrag={pauseAutoplay}
            onMomentumScrollEnd={onMomentumScrollEnd}
            getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
            renderItem={renderItem}
          />
        ) : (
          // First frame, before the bar knows its width: show the first card statically.
          <ActiveOrderCard order={activeOrders[0]} position={1} total={count} />
        )
      ) : (
        <ActiveOrderCard order={activeOrders[0]} position={1} total={1} />
      )}

      {sliding ? (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 bottom-1 flex-row justify-center gap-1">
          {activeOrders.map((order, dotIndex) => {
            const active = dotIndex === index;
            return (
              <View
                key={order.id}
                className={`h-1 rounded-full ${active ? 'w-3 bg-primary' : 'w-1 bg-border'}`}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
