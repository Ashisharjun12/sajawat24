import type { HomeCategory } from '@/module/home/lib/home-catalog';
import {
  Baby,
  Building2,
  Cake,
  Flower,
  Gem,
  Gift,
  Heart,
  HeartHandshake,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from 'lucide-react-native';

const ICON_MAP: Record<string, LucideIcon> = {
  cake: Cake,
  heart: Heart,
  baby: Baby,
  gem: Gem,
  party: PartyPopper,
  sparkles: Sparkles,
  building: Building2,
  'heart-handshake': HeartHandshake,
  gift: Gift,
  flower: Flower,
  home: Building2,
};

/** Tailwind bg + icon color pairs — aligned with web `category-icons.js`. */
export const CATEGORY_TONE_CLASSES: Record<string, { bg: string; icon: string }> = {
  amber: { bg: 'bg-amber-100', icon: 'text-amber-600' },
  rose: { bg: 'bg-rose-100', icon: 'text-rose-500' },
  sky: { bg: 'bg-sky-100', icon: 'text-sky-600' },
  violet: { bg: 'bg-violet-100', icon: 'text-violet-600' },
  orange: { bg: 'bg-orange-100', icon: 'text-orange-500' },
  emerald: { bg: 'bg-emerald-100', icon: 'text-emerald-600' },
  slate: { bg: 'bg-slate-100', icon: 'text-slate-600' },
  pink: { bg: 'bg-pink-100', icon: 'text-pink-500' },
};

const TONE_KEYS = Object.keys(CATEGORY_TONE_CLASSES);

function toneFromSlug(slug: string | undefined): string {
  if (!slug) return TONE_KEYS[0];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % TONE_KEYS.length;
  }
  return TONE_KEYS[hash];
}

/**
 * Bar icon for a category. When the admin uploaded a custom icon, `iconUrl` is set and the tone
 * classes are empty: the image is shown as uploaded, with no colour behind it.
 */
export function resolveCategoryIcon({
  iconKey,
  iconTone,
  iconUrl,
  slug,
}: {
  iconKey?: string | null;
  iconTone?: string | null;
  iconUrl?: string | null;
  slug?: string;
}) {
  const Icon = ICON_MAP[iconKey ?? ''] ?? PartyPopper;
  if (iconUrl) {
    return { Icon, toneBg: '', toneIcon: '', iconUrl };
  }
  const tone =
    iconTone && CATEGORY_TONE_CLASSES[iconTone] ? iconTone : toneFromSlug(slug);
  const classes = CATEGORY_TONE_CLASSES[tone] ?? CATEGORY_TONE_CLASSES.amber;
  return { Icon, toneBg: classes.bg, toneIcon: classes.icon, iconUrl: null };
}

export function listTopLevelCategories(categories: HomeCategory[]): HomeCategory[] {
  if (!Array.isArray(categories)) return [];
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}
