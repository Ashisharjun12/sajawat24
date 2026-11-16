import { ScalePressable } from '@/components/shell';
import { Text } from '@/components/ui/text';
import type { PublicOrderSummary } from '@/api/orders.api';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
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

/** Reserve scroll space so feed content clears the floating card (card ~74 + 8 bottom gap). */
export const HOME_ACTIVE_ORDER_BAR_HEIGHT = 84;

/** Time each booking stays on screen before the bar slides to the next one. */
const AUTOPLAY_MS = 4000;

type Props = {
  enabled?: boolean;
};

function openOrder(orderId: string) {
  lightImpact();
  router.push(`/(app)/profile/orders/${orderId}` as Href);
}

function statusSubtitle(order: PublicOrderSummary): string {
  const name = order.primaryName?.trim() || 'your booking';
  switch (order.status) {
    case 'ON_SITE':
      return `Setting up ${name}`;
    case 'EN_ROUTE':
      return `Heading to you · ${name}`;
    case 'ASSIGNED':
      return `Getting ready · ${name}`;
    default:
      return name;
  }
}

/** Soft pulsing ring behind a solid dot — the "live" signal (Swiggy/Zomato style). */
function LiveDot({ arrived }: { arrived: boolean }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(pulse);
  }, [pulse]);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 1.6 }],
  }));
  const tone = arrived ? 'bg-success' : 'bg-primary';
  return (
    <View className="size-3.5 items-center justify-center rounded-full bg-surface">
      <Animated.View className={`absolute size-2 rounded-full ${tone}`} style={ringStyle} />
      <View className={`size-2 rounded-full ${tone}`} />
    </View>
  );
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
  const [thumbFailed, setThumbFailed] = useState(false);
  const title = homeActiveOrderTitle(order.status);
  const subtitle = statusSubtitle(order);
  const arrived = order.status === 'ON_SITE';
  const thumb = !thumbFailed ? order.primaryImageUrl?.trim() || null : null;

  return (
    <ScalePressable
      haptic
      onPress={() => openOrder(order.id)}
      pressScale={0.98}
      style={width ? { width } : undefined}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}.${total > 1 ? ` ${position} of ${total}.` : ''} Track order`}>
      <View className="flex-row items-center gap-3 px-3 py-2.5">
        {/* Booking photo with a live dot (truck icon when there's no photo). */}
        <View>
          <View className="size-12 items-center justify-center overflow-hidden rounded-xl bg-primary-tint">
            {thumb ? (
              <Image
                source={{ uri: thumb }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
                onError={() => setThumbFailed(true)}
              />
            ) : (
              <Image
                source={ACTIVE_ORDER_TRUCK_ICON_URL}
                style={{ width: 34, height: 34 }}
                contentFit="contain"
                accessibilityIgnoresInvertColors
              />
            )}
          </View>
          <View className="absolute -right-1 -top-1">
            <LiveDot arrived={arrived} />
          </View>
        </View>

        <View className="min-w-0 flex-1 gap-0.5">
          <View className="flex-row items-center gap-1.5 pr-6">
            <Text className="shrink text-[15px] font-semibold text-foreground" numberOfLines={1}>
              {title}
            </Text>
          </View>
          <Text className="text-muted-foreground text-caption" numberOfLines={1}>
            {subtitle}
          </Text>
        </View>

        <View className="size-9 items-center justify-center rounded-full bg-primary">
          <Icon as={ChevronRight} className="size-5 text-primary-foreground" />
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
    // Floating card, inset from the edges, sitting just above the tab bar.
    <View className="px-3 pb-2" pointerEvents="box-none">
    <View
      className="overflow-hidden rounded-2xl border border-border/70 bg-surface shadow-raised"
      style={{ elevation: 10 }}
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
          className="absolute right-3 top-1.5 flex-row gap-1">
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
    </View>
  );
}
