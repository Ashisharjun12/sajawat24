import { Text } from '@/components/ui/text';
import {
  BOTTOM_TAB_ROUTE_NAMES,
  TAB_BAR_VISIBLE_ROUTE_NAMES,
  TAB_ROOT_HREFS,
} from '@/lib/tab-roots';
import { cn } from '@/lib/utils';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { type Href, router } from 'expo-router';
import { Home, LayoutGrid, ShoppingBag, User, Zap } from 'lucide-react-native';
import { lightImpact } from '@/lib/light-haptic';
import {
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_FLOAT_BOTTOM_GAP,
  TAB_BAR_FLOAT_SIDE_INSET,
  TAB_BAR_FLOAT_TOP_GAP,
} from '@/lib/tab-bar-metrics';
import { useThemeColors } from '@/lib/theme';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Tab switch timing: highlight slide + icon scale move together, ease-out, no overshoot. */
const SLIDE_TIMING = { duration: 280, easing: Easing.out(Easing.cubic) };

/** Bar content height (shared with overlays); the safe-area inset is added below it. */
const TAB_BAR_HEIGHT = TAB_BAR_CONTENT_HEIGHT;

const VISIBLE_TABS = BOTTOM_TAB_ROUTE_NAMES;

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  category: 'Category',
  explore: 'Explore',
  instant: 'Instant',
  profile: 'Account',
};

function TabIcon({
  routeName,
  focused,
  color,
}: {
  routeName: string;
  focused: boolean;
  color: string;
}) {
  const stroke = focused ? 2.4 : 1.75;
  const size = 24;
  const scale = useSharedValue(focused ? 1.06 : 1);

  // Smooth, no bounce: same timing as the sliding highlight.
  useEffect(() => {
    scale.value = withTiming(focused ? 1.06 : 1, SLIDE_TIMING);
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let icon = null;
  switch (routeName) {
    case 'index':
      icon = (
        <Home size={size} color={color} strokeWidth={stroke} fill={focused ? color : 'none'} />
      );
      break;
    case 'category':
      icon = <LayoutGrid size={size} color={color} strokeWidth={stroke} />;
      break;
    case 'explore':
      icon = <ShoppingBag size={size} color={color} strokeWidth={stroke} />;
      break;
    case 'instant':
      icon = <Zap size={size} color={color} strokeWidth={stroke} fill={focused ? color : 'none'} />;
      break;
    case 'profile':
      icon = <User size={size} color={color} strokeWidth={stroke} />;
      break;
    default:
      break;
  }

  return <Animated.View style={animatedStyle}>{icon}</Animated.View>;
}

function isTabBarHidden(
  descriptors: BottomTabBarProps['descriptors'],
  routeKey: string,
): boolean {
  const style = descriptors[routeKey]?.options?.tabBarStyle;
  return (
    style != null &&
    typeof style === 'object' &&
    'display' in style &&
    style.display === 'none'
  );
}

/** `#RRGGBB` + alpha → `#RRGGBBAA`; anything else falls back. */
function withAlpha(hex: string, alpha: number, fallback: string): string {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return fallback;
  const a = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${a}`;
}

/**
 * Floating pill tab bar: rounded card inset from the screen edges, soft shadow, and a tinted
 * rounded highlight behind the active tab. It stays in the layout (screens end above it), so
 * no screen needs extra bottom padding; the gap around the pill shows the screen background.
 */
export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const focusedRoute = state.routes[state.index];
  const focusedHidden =
    !TAB_BAR_VISIBLE_ROUTE_NAMES.has(focusedRoute.name) ||
    isTabBarHidden(descriptors, focusedRoute.key);

  if (focusedHidden) {
    return null;
  }

  const visibleRoutes = state.routes.filter((r) => VISIBLE_TABS.has(r.name));
  const activeVisibleIndex = visibleRoutes.findIndex((r) => r.key === focusedRoute.key);
  const instantActive = focusedRoute.name === 'instant';

  return (
    <View
      style={{
        backgroundColor: theme.background,
        paddingTop: TAB_BAR_FLOAT_TOP_GAP,
        paddingBottom: insets.bottom + TAB_BAR_FLOAT_BOTTOM_GAP,
        paddingHorizontal: TAB_BAR_FLOAT_SIDE_INSET,
      }}>
      <View
        className="border border-border/70"
        style={{
          height: TAB_BAR_HEIGHT + 2,
          // Explicit radius (not a class) so the pill is always fully round.
          borderRadius: PILL_RADIUS,
          paddingHorizontal: ROW_PADDING_X,
          backgroundColor: theme.card,
          elevation: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
        }}>
        <TabRow
          count={visibleRoutes.length}
          activeIndex={activeVisibleIndex}
          tint={
            instantActive
              ? withAlpha(theme.instant, 0.12, theme.primaryTint)
              : theme.primaryTint
          }>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === routeIndex;
          const label = TAB_LABELS[route.name] ?? route.name;
          // Crimson is reserved for Instant; every other active tab is primary.
          const activeColor = route.name === 'instant' ? theme.instant : theme.primary;
          const color = focused ? activeColor : theme.mutedForeground;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (event.defaultPrevented) return;

            lightImpact();
            if (focused) {
              const root = TAB_ROOT_HREFS[route.name];
              if (root) {
                router.navigate(root as Href);
              }
              return;
            }
            navigation.navigate(route.name);
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              className="min-h-11 min-w-[56px] flex-1 items-center justify-center gap-0.5">
              <TabIcon routeName={route.name} focused={focused} color={color} />
              <Text
                className={cn('text-micro', focused ? 'font-semibold' : 'font-medium')}
                style={{ color }}
                numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
        </TabRow>
      </View>
    </View>
  );
}

/** Fully round corners for the bar and the active highlight. */
const PILL_RADIUS = 999;
/** Horizontal padding inside the bar, around the tabs. */
const ROW_PADDING_X = 6;
/** Gap between the active highlight and the bar edge (top/bottom) and its tab (sides). */
const HIGHLIGHT_INSET_Y = 6;
const HIGHLIGHT_INSET_X = 3;

/**
 * Tab row with one shared highlight pill behind the tabs. When the active tab changes the
 * pill slides smoothly to it (ease-out, no bounce).
 */
function TabRow({
  count,
  activeIndex,
  tint,
  children,
}: {
  count: number;
  activeIndex: number;
  tint: string;
  children: ReactNode;
}) {
  const [rowWidth, setRowWidth] = useState(0);
  const tabWidth = count > 0 ? rowWidth / count : 0;
  const translateX = useSharedValue(0);
  const visible = useSharedValue(0);
  const placed = useRef(false);

  useEffect(() => {
    if (tabWidth === 0 || activeIndex < 0) {
      visible.value = withTiming(0, { duration: 150 });
      return;
    }
    const target = activeIndex * tabWidth;
    if (!placed.current) {
      // First layout: start on the active tab (no slide in from the left).
      translateX.value = target;
      placed.current = true;
    } else {
      // Plain slide with ease-out: no spring, no overshoot, no stretch.
      translateX.value = withTiming(target, SLIDE_TIMING);
    }
    visible.value = withTiming(1, { duration: 150 });
  }, [activeIndex, tabWidth, translateX, visible]);

  const highlightStyle = useAnimatedStyle(() => ({
    opacity: visible.value,
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      className="flex-1 flex-row items-center"
      onLayout={(e) => setRowWidth(e.nativeEvent.layout.width)}>
      {tabWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              left: HIGHLIGHT_INSET_X,
              top: HIGHLIGHT_INSET_Y,
              bottom: HIGHLIGHT_INSET_Y,
              width: tabWidth - HIGHLIGHT_INSET_X * 2,
              borderRadius: PILL_RADIUS,
              backgroundColor: tint,
            },
            highlightStyle,
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}
