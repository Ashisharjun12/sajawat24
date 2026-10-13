export type HomeAnnouncementTone = 'info' | 'promo' | 'warning';

export type HomeAnnouncement = {
  id: string;
  message: string;
  title: string | null;
  subtitle: string | null;
  tag: string | null;
  imageUrl: string | null;
  mobileImageUrl: string | null;
  alt: string | null;
  href: string | null;
  ctaLabel: string | null;
  tone: HomeAnnouncementTone;
  accentColor: string | null;
  dismissible: boolean;
  sortIndex: number;
};

const TONE_ACCENT_FALLBACK: Record<HomeAnnouncementTone, string> = {
  info: '#0284c7',
  promo: '#ca8a04',
  warning: '#f59e0b',
};

function normalizeHex(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const hex = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : null;
}

function normalizeTone(value: unknown): HomeAnnouncementTone {
  if (value === 'info' || value === 'warning' || value === 'promo') return value;
  return 'promo';
}

export function normalizeHomeAnnouncement(raw: unknown): HomeAnnouncement | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  if (!row.id) return null;
  const message = typeof row.message === 'string' ? row.message.trim() : '';
  const title = typeof row.title === 'string' ? row.title.trim() || null : null;
  const subtitle = typeof row.subtitle === 'string' ? row.subtitle.trim() || null : null;
  const tag = typeof row.tag === 'string' ? row.tag.trim() || null : null;
  const imageUrl = typeof row.imageUrl === 'string' ? row.imageUrl.trim() || null : null;
  const mobileImageUrl =
    typeof row.mobileImageUrl === 'string' ? row.mobileImageUrl.trim() || null : null;
  const alt = typeof row.alt === 'string' ? row.alt.trim() || null : null;
  const href = typeof row.href === 'string' ? row.href.trim() || null : null;
  const ctaLabel = typeof row.ctaLabel === 'string' ? row.ctaLabel.trim() || null : null;
  const tone = normalizeTone(row.tone);
  const accentColor = normalizeHex(row.accentColor);
  const dismissible = row.dismissible !== false;
  const sortIndex = typeof row.sortIndex === 'number' ? row.sortIndex : 0;

  if (!message && !title && !subtitle) return null;

  return {
    id: String(row.id),
    message,
    title,
    subtitle,
    tag,
    imageUrl,
    mobileImageUrl,
    alt,
    href,
    ctaLabel,
    tone,
    accentColor,
    dismissible,
    sortIndex,
  };
}

export function normalizeHomeAnnouncements(raw: unknown): HomeAnnouncement[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => normalizeHomeAnnouncement(row))
    .filter(Boolean) as HomeAnnouncement[];
}

export function announcementHeroImageUrl(item: HomeAnnouncement): string | null {
  return item.mobileImageUrl || item.imageUrl || null;
}

export function announcementAccentHex(item: HomeAnnouncement): string {
  return item.accentColor ?? TONE_ACCENT_FALLBACK[item.tone];
}

export function announcementDisplayCopy(item: HomeAnnouncement): {
  title: string;
  subtitle: string;
} {
  if (item.title && item.subtitle) {
    return { title: item.title, subtitle: item.subtitle };
  }
  if (item.title) {
    return {
      title: item.title,
      subtitle: item.subtitle || item.message || '',
    };
  }
  const lines = item.message.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length >= 2) {
    return { title: lines[0], subtitle: lines.slice(1).join(' ') };
  }
  const msg = item.message || item.subtitle || ' ';
  return {
    title: msg,
    subtitle: item.subtitle || '',
  };
}

export function pickLaunchAnnouncement(
  items: HomeAnnouncement[],
  dismissedIds: Set<string>,
): HomeAnnouncement | null {
  for (const item of items) {
    if (!dismissedIds.has(item.id)) return item;
  }
  return null;
}
