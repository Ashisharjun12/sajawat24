export const SECTION_BADGE_COLORS = [
    "amber",
    "emerald",
    "rose",
    "sky",
    "violet",
    "orange",
    "slate",
] as const;

export type SectionBadgePreset = (typeof SECTION_BADGE_COLORS)[number];

export const DEFAULT_SECTION_BADGE_COLOR: SectionBadgePreset = "amber";

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export function isSectionBadgeHex(value: string): boolean {
    return HEX_COLOR_RE.test(value.trim());
}

export function normalizeSectionBadgeHex(value: string): string | null {
    const trimmed = value.trim();
    if (!HEX_COLOR_RE.test(trimmed)) {
        return null;
    }
    const body = trimmed.slice(1);
    if (body.length === 3) {
        const expanded = body
            .split("")
            .map((char) => char + char)
            .join("");
        return `#${expanded.toLowerCase()}`;
    }
    return `#${body.toLowerCase()}`;
}

export function isSectionBadgePreset(value: string): value is SectionBadgePreset {
    return SECTION_BADGE_COLORS.includes(value as SectionBadgePreset);
}

/** Preset token or normalized #rrggbb hex. */
export function parseSectionBadgeColor(value: unknown): string {
    if (typeof value !== "string") {
        return DEFAULT_SECTION_BADGE_COLOR;
    }
    const trimmed = value.trim();
    if (isSectionBadgePreset(trimmed)) {
        return trimmed;
    }
    const hex = normalizeSectionBadgeHex(trimmed);
    if (hex) {
        return hex;
    }
    return DEFAULT_SECTION_BADGE_COLOR;
}
