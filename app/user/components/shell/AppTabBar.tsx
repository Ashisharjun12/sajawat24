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
import { useThemeColors } from '@/lib/theme';
import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Bar content height; the safe-area inset is added below it. */
const TAB_BAR_HEIGHT = 72;

const VISIBLE_TABS = BOTTOM_TAB_ROUTE_NAMES;

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  category: 'Category',
  explore: 'Explore',
  instant: 'Instant',
  profile: 'Profile',
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

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, { damping: 14, stiffness: 300 });
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

  return (
    <View
      className="relative border-t border-black/10"
      style={{
        backgroundColor: theme.card,
        paddingBottom: insets.bottom,
        elevation: 8,
        shadowColor: theme.foreground,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
      }}>
      <View
        pointerEvents="none"
        className="absolute left-0 right-0 top-0 z-10 flex-row px-2"
        style={{ height: 3 }}
        accessibilityElementsHidden>
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === routeIndex;
          const activeColor = route.name === 'instant' ? theme.instant : theme.primary;
          return (
            <View key={`${route.key}-indicator`} className="flex-1 items-center">
              {focused ? (
                <View
                  className="h-[3px] w-[72%] max-w-[88px] rounded-b-sm"
                  style={{ backgroundColor: activeColor }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View className="flex-row items-center justify-around px-2" style={{ height: TAB_BAR_HEIGHT }}>
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
              className="min-h-11 min-w-[60px] flex-1 items-center justify-center gap-1">
              <TabIcon routeName={route.name} focused={focused} color={color} />
              <Text
                className={cn('text-micro', focused ? 'font-semibold' : 'font-medium')}
                style={{ color }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
