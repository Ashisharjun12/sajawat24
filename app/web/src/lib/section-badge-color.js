export const SECTION_BADGE_COLORS = [
  "amber",
  "emerald",
  "rose",
  "sky",
  "violet",
  "orange",
  "slate",
];

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/** Tailwind classes for preset image corner badges (bg + text). */
export const SECTION_BADGE_COLOR_CLASS = {
  amber: "bg-amber-500 text-white",
  emerald: "bg-emerald-600 text-white",
  rose: "bg-rose-500 text-white",
  sky: "bg-sky-600 text-white",
  violet: "bg-violet-600 text-white",
  orange: "bg-orange-500 text-white",
  slate: "bg-slate-600 text-white",
};

export function isSectionBadgeHex(value) {
  return typeof value === "string" && HEX_COLOR_RE.test(value.trim());
}

export function normalizeSectionBadgeHex(value) {
  const trimmed = String(value ?? "").trim();
  if (!HEX_COLOR_RE.test(trimmed)) return null;
  const body = trimmed.slice(1);
  if (body.length === 3) {
    return `#${body.split("").map((c) => c + c).join("").toLowerCase()}`;
  }
  return `#${body.toLowerCase()}`;
}

export function sectionBadgeColorClass(color) {
  return SECTION_BADGE_COLOR_CLASS[color] ?? SECTION_BADGE_COLOR_CLASS.amber;
}

/** className + optional inline background for custom hex. */
export function sectionBadgeAppearance(color) {
  if (isSectionBadgeHex(color)) {
    const bg = normalizeSectionBadgeHex(color);
    return {
      className: "text-white",
      style: bg ? { backgroundColor: bg } : undefined,
    };
  }
  return {
    className: sectionBadgeColorClass(color),
    style: undefined,
  };
}
