/**
 * Brand design tokens, shared 1:1 with `app/web` (`src/index.css`) and `app/user`.
 *
 * Use these for native props that cannot take a className (map pins, SDK themes,
 * icon `color`). For anything renderable, prefer the NativeWind semantic classes
 * in `global.css` / `tailwind.config.js` which are generated from these values.
 */

export const colors = {
  light: {
    primary: '#0F766E',
    primaryDark: '#115E59',
    primaryTint: '#D9F0ED',
    onPrimary: '#FFFFFF',
    cta: '#FF8A1F',
    onCta: '#1C1917',
    instant: '#E11D48',
    bg: '#F4FAF9',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    border: '#E2ECEA',
    success: '#16A34A',
    scrim: 'rgba(15,23,42,0.55)',
  },
  dark: {
    primary: '#14B8A6',
    primaryDark: '#0F766E',
    primaryTint: '#123A37',
    onPrimary: '#042F2E',
    cta: '#FF8A1F',
    onCta: '#1C1917',
    instant: '#E11D48',
    bg: '#0B1514',
    surface: '#12201F',
    text: '#F1F5F4',
    muted: '#94A3A0',
    border: '#223836',
    success: '#4ADE80',
    scrim: 'rgba(0,0,0,0.65)',
  },
} as const;

/** Disabled buttons use a flat fill, never opacity. */
export const disabled = { bg: '#E2E8E7', text: '#94A3A0' } as const;

export const radius = { btn: 12, input: 12, card: 16, sheet: 24, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 6: 24, 8: 32 } as const;

export const type = {
  display: { fontFamily: 'Poppins_600SemiBold', fontSize: 28, lineHeight: 36 },
  h1: { fontFamily: 'Poppins_600SemiBold', fontSize: 22, lineHeight: 30 },
  h2: { fontFamily: 'Poppins_600SemiBold', fontSize: 18, lineHeight: 26 },
  h3: { fontFamily: 'Poppins_600SemiBold', fontSize: 16, lineHeight: 24 },
  body: { fontFamily: 'Poppins_400Regular', fontSize: 14, lineHeight: 20 },
  bodyM: { fontFamily: 'Poppins_500Medium', fontSize: 14, lineHeight: 20 },
  caption: { fontFamily: 'Poppins_400Regular', fontSize: 12, lineHeight: 18 },
  micro: { fontFamily: 'Poppins_500Medium', fontSize: 11, lineHeight: 16 },
  button: { fontFamily: 'Poppins_600SemiBold', fontSize: 15, lineHeight: 20 },
} as const;

export const button = {
  heightL: 48,
  heightM: 40,
  heightS: 32,
  minTouch: 44,
  padX: 20,
  iconSize: 18,
} as const;

/** Layout breaks on large OS font settings past this. */
export const MAX_FONT_SCALE = 1.3;

/** Card elevation — `0 4 12 rgba(15,23,42,.05)`. */
export const cardShadow = {
  shadowColor: '#0F172A',
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.05,
  shadowRadius: 12,
  elevation: 2,
} as const;

/** Motion budget: 100-300ms, ease-out. */
export const motion = { press: 100, sheet: 240, confirm: 300, pressScale: 0.98 } as const;

export type ColorScheme = keyof typeof colors;
export type BrandColors = typeof colors.light;
