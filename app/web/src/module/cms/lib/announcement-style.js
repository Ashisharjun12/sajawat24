const TONE_CLASS = {
  info: "bg-sky-600 text-white",
  promo: "bg-primary text-primary-foreground",
  warning: "bg-amber-500 text-amber-950",
};

const TONE_COLOR = {
  info: "#0284c7",
  promo: "#ca8a04",
  warning: "#f59e0b",
};

function normalizeHex(value) {
  if (!value) return null;
  const hex = value.startsWith("#") ? value : `#${value}`;
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : null;
}

function textColorForBg(hex) {
  const normalized = normalizeHex(hex);
  if (!normalized) return "#ffffff";
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.62 ? "#111827" : "#ffffff";
}

export function announcementBarStyle(announcements = []) {
  const first = announcements[0];
  if (!first) return { className: TONE_CLASS.promo };

  const accent = normalizeHex(first.accentColor);
  if (accent) {
    return {
      style: {
        backgroundColor: accent,
        color: textColorForBg(accent),
      },
    };
  }

  const toneClass = TONE_CLASS[first.tone] ?? TONE_CLASS.promo;
  return { className: toneClass };
}

export function announcementAccentColor(announcement) {
  return normalizeHex(announcement?.accentColor) || TONE_COLOR[announcement?.tone] || TONE_COLOR.promo;
}

export function normalizeAnnouncement(row) {
  return {
    id: row.id,
    message: row.message?.trim() || "",
    href: row.href?.trim() || null,
    tone: row.tone ?? "promo",
    accentColor: row.accentColor?.trim() || null,
    dismissible: row.dismissible ?? true,
    sortIndex: row.sortIndex ?? 0,
  };
}
