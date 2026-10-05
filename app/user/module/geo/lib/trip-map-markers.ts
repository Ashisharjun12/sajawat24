import { colors } from '@/lib/design-tokens';

const INK = colors.light.text;

export const TRIP_ROUTE_PAINT = {
  casing: { 'line-color': colors.light.surface, 'line-width': 8, 'line-opacity': 0.9 },
  line: { 'line-color': INK, 'line-width': 5, 'line-opacity': 1 },
  fallback: { 'line-color': INK, 'line-width': 4, 'line-opacity': 0.75 },
} as const;
