import { triggerHaptic } from '@/components/motion/haptics';
import { Text } from '@/components/ui/text';
import { NAV_THEME } from '@/lib/theme';
import {
  shouldHideVendorTabBar,
  TAB_ROOT_HREFS,
  tabLabel,
  tabNameForPathname,
  visibleTabRouteNames,
} from '@/lib/tab-roots';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth.store';
import { selectIsFieldShell, usePartnerModeStore } from '@/store/partner-mode.store';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import { type Href, router, usePathname } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Platform, Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<
  string,
  { active: TabIconName; inactive: TabIconName }
> = {
  index: { active: 'home', inactive: 'home-outline' },
  bookings: { active: 'calendar', inactive: 'calendar-outline' },
  messages: { active: 'chatbubbles', inactive: 'chatbubbles-outline' },
  payouts: { active: 'wallet', inactive: 'wallet-outline' },
  profile: { active: 'person', inactive: 'person-outline' },
};

function TabBarIcon({ focused, color, size, routeName }: {
  focused: boolean;
  color: string;
  size: number;
  routeName: string;
}) {
  const icons = TAB_ICONS[routeName];
  const scale = useSharedValue(focused ? 1.06 : 1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, { damping: 14, stiffness: 300 });
  }, [focused, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (!icons) return null;

  return (
    <Animated.View style={animatedStyle}>
      <Ionicons
        name={focused ? icons.active : icons.inactive}
        size={size}
        color={color}
      />
    </Animated.View>
  );
}

export function VendorTabBar(_props: BottomTabBarProps) {
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const theme = NAV_THEME[colorScheme ?? 'light'];
  const user = useAuthStore((s) => s.user);
  const partnerMode = usePartnerModeStore((s) => s.mode);
  const isFieldShell = selectIsFieldShell(partnerMode, user);

  if (shouldHideVendorTabBar(pathname)) {
    return null;
  }

  const activeTab = tabNameForPathname(pathname);
  const tabs = visibleTabRouteNames(isFieldShell);

  return (
    <View
      className="border-t border-border/60 bg-card"
      style={{
        backgroundColor: theme.colors.card,
        paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 10 : 6),
        paddingTop: 8,
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      }}>
      <View className="flex-row items-end justify-around px-1">
        {tabs.map((routeName) => {
          const focused = activeTab === routeName;
          const label = tabLabel(routeName, isFieldShell);
          const color = focused ? theme.colors.primary : `${theme.colors.text}80`;

          const onPress = () => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            const root = TAB_ROOT_HREFS[routeName];
            if (root) {
              router.navigate(root as Href);
            }
          };

          return (
            <Pressable
              key={routeName}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={label}
              className="min-w-[60px] flex-1 items-center gap-1 pb-1">
              <TabBarIcon focused={focused} color={color} size={24} routeName={routeName} />
              <Text
                className={cn('text-[11px]', focused ? 'font-semibold' : 'font-normal')}
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
