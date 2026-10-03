import {
  BabyIcon,
  Building2Icon,
  CakeIcon,
  FlowerIcon,
  GemIcon,
  GiftIcon,
  HeartHandshakeIcon,
  HeartIcon,
  PartyPopperIcon,
  SparklesIcon,
} from "lucide-react";

const ICON_MAP = {
  cake: CakeIcon,
  heart: HeartIcon,
  baby: BabyIcon,
  gem: GemIcon,
  party: PartyPopperIcon,
  sparkles: SparklesIcon,
  building: Building2Icon,
  "heart-handshake": HeartHandshakeIcon,
  gift: GiftIcon,
  flower: FlowerIcon,
};

const TONE_MAP = {
  amber:
    "bg-amber-100 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
  rose: "bg-rose-100 text-rose-500 dark:bg-rose-400/15 dark:text-rose-400",
  sky: "bg-sky-100 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400",
  violet:
    "bg-violet-100 text-violet-600 dark:bg-violet-400/15 dark:text-violet-300",
  orange:
    "bg-orange-100 text-orange-500 dark:bg-orange-400/15 dark:text-orange-400",
  emerald:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  slate:
    "bg-slate-100 text-slate-600 dark:bg-slate-400/15 dark:text-slate-300",
  pink: "bg-pink-100 text-pink-500 dark:bg-pink-400/15 dark:text-pink-400",
};

const TONE_KEYS = Object.keys(TONE_MAP);

function toneFromSlug(slug) {
  if (!slug) return TONE_KEYS[0];
  let hash = 0;
  for (let i = 0; i < slug.length; i += 1) {
    hash = (hash + slug.charCodeAt(i)) % TONE_KEYS.length;
  }
  return TONE_KEYS[hash];
}

export function resolveCategoryIcon({ iconKey, iconTone, slug }) {
  const Icon = ICON_MAP[iconKey] ?? PartyPopperIcon;
  const tone = iconTone && TONE_MAP[iconTone] ? iconTone : toneFromSlug(slug);
  const iconBg = TONE_MAP[tone] ?? TONE_MAP.amber;
  return { Icon, iconBg };
}

export function listTopLevelCategories(categories) {
  if (!Array.isArray(categories)) return [];
  return [...categories].sort((a, b) => a.name.localeCompare(b.name));
}
