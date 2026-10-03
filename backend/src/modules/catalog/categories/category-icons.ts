export const CATEGORY_ICON_KEYS = [
    "cake",
    "heart",
    "baby",
    "gem",
    "party",
    "sparkles",
    "building",
    "heart-handshake",
    "gift",
    "flower",
] as const;

export const CATEGORY_ICON_TONES = [
    "amber",
    "rose",
    "sky",
    "violet",
    "orange",
    "emerald",
    "slate",
    "pink",
] as const;

export type CategoryIconKey = (typeof CATEGORY_ICON_KEYS)[number];
export type CategoryIconTone = (typeof CATEGORY_ICON_TONES)[number];
