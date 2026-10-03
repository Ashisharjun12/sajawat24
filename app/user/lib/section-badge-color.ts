export const SECTION_BADGE_COLORS = [
  'amber',
  'emerald',
  'rose',
  'sky',
  'violet',
  'orange',
  'slate',
] as const;

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Preset → solid fill (inline style — NativeWind won't pick up dynamic `bg-*` classes). */
export const SECTION_BADGE_PRESET_HEX: Record<string, string> = {
  amber: '#f59e0b',
  emerald: '#059669',
  rose: '#f43f5e',
  sky: '#0284c7',
  violet: '#7c3aed',
  orange: '#f97316',
  slate: '#475569',
};

export function isSectionBadgeHex(value: unknown): boolean {
  return typeof value === 'string' && HEX_COLOR_RE.test(value.trim());
}

export function normalizeSectionBadgeHex(value: unknown): string | null {
  const trimmed = String(value ?? '').trim();
  if (!HEX_COLOR_RE.test(trimmed)) return null;
  const body = trimmed.slice(1);
  if (body.length === 3) {
    return `#${body.split('').map((c) => c + c).join('').toLowerCase()}`;
  }
  return `#${body.toLowerCase()}`;
}

export function resolveSectionBadgeBackground(color: unknown): string {
  if (isSectionBadgeHex(color)) {
    return normalizeSectionBadgeHex(color) ?? SECTION_BADGE_PRESET_HEX.amber;
  }
  const key = typeof color === 'string' ? color.trim() : '';
  return SECTION_BADGE_PRESET_HEX[key] ?? SECTION_BADGE_PRESET_HEX.amber;
}

export type SectionBadgeAppearance = {
  className: string;
  backgroundColor: string;
};

export function sectionBadgeAppearance(color: unknown): SectionBadgeAppearance {
  return {
    className: 'text-white',
    backgroundColor: resolveSectionBadgeBackground(color),
  };
}
