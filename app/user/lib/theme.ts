import { DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { useColorScheme } from 'nativewind';
import { colors, disabled } from '@/lib/design-tokens';

/** Brand primary (teal) for native props that cannot take a className. */
export const BRAND_PRIMARY_HEX = colors.light.primary;

/** Instant tab + instant badge. Crimson is reserved for Instant surfaces only. */
export const INSTANT_TAB_HEX = colors.light.instant;

/** Conversion orange — Book Now / Pay only, one per screen. */
export const BRAND_CTA_HEX = colors.light.cta;

/** Default horizontal inset for stack screens. */
export const SCREEN_HORIZONTAL_GUTTER = 20;

function scheme(mode: 'light' | 'dark') {
  const c = colors[mode];
  return {
    background: c.bg,
    foreground: c.text,
    card: c.surface,
    cardForeground: c.text,
    popover: c.surface,
    popoverForeground: c.text,
    primary: c.primary,
    primaryForeground: c.onPrimary,
    primaryDark: c.primaryDark,
    primaryTint: c.primaryTint,
    cta: c.cta,
    ctaForeground: c.onCta,
    instant: c.instant,
    instantForeground: '#FFFFFF',
    success: c.success,
    muted: c.muted,
    mutedForeground: c.muted,
    border: c.border,
    input: c.border,
    ring: c.primary,
    scrim: c.scrim,
    disabled: mode === 'light' ? disabled.bg : c.border,
    disabledForeground: disabled.text,
    destructive: mode === 'light' ? '#DC2626' : '#F87171',
  };
}

export const THEME = {
  light: scheme('light'),
  dark: scheme('dark'),
} as const;

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      background: THEME.light.background,
      border: THEME.light.border,
      card: THEME.light.card,
      notification: THEME.light.destructive,
      primary: THEME.light.primary,
      text: THEME.light.foreground,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      background: THEME.dark.background,
      border: THEME.dark.border,
      card: THEME.dark.card,
      notification: THEME.dark.destructive,
      primary: THEME.dark.primary,
      text: THEME.dark.foreground,
    },
  },
};

/**
 * Resolved brand colors for the active scheme. Use for native-only props
 * (icon `color`, map pins, SDK themes); prefer classNames everywhere else.
 */
export function useThemeColors() {
  const { colorScheme } = useColorScheme();
  return THEME[colorScheme === 'dark' ? 'dark' : 'light'];
}
