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
import { BRAND_PRIMARY_HEX, INSTANT_TAB_HEX } from '@/lib/theme';
import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Labels: active black, inactive light grey. Icons: active yellow (Instant orange). */
const ACTIVE_ICON = BRAND_PRIMARY_HEX;
const INACTIVE_ICON = '#A3A3A3';
const ACTIVE_LABEL = '#1A1A1A';
const INACTIVE_LABEL = '#A3A3A3';

const VISIBLE_TABS = BOTTOM_TAB_ROUTE_NAMES;

const TAB_LABELS: Record<string, string> = {
  index: 'Home',
  category: 'Category',
  explore: 'Explore',
  instant: 'Instant',
  profile: 'Profile',
};

function tabIconColor(routeName: string, focused: boolean) {
  if (!focused) return INACTIVE_ICON;
  if (routeName === 'instant') return INSTANT_TAB_HEX;
  return ACTIVE_ICON;
}

function TabIcon({ routeName, focused }: { routeName: string; focused: boolean }) {
  const color = tabIconColor(routeName, focused);
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
      className="border-t border-border/80 bg-background"
      style={{
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6),
        paddingTop: 8,
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -1 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      }}>
      <View className="flex-row items-end justify-around px-2">
        {visibleRoutes.map((route) => {
          const routeIndex = state.routes.findIndex((r) => r.key === route.key);
          const focused = state.index === routeIndex;
          const label = TAB_LABELS[route.name] ?? route.name;

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
              className="min-w-[60px] flex-1 items-center gap-1 pb-1">
              <TabIcon routeName={route.name} focused={focused} />
              <Text
                className={cn('text-[11px]', focused ? 'font-semibold' : 'font-medium')}
                style={{ color: focused ? ACTIVE_LABEL : INACTIVE_LABEL }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
