import {
    BRAND_LOGO_LIGHT_URL,
    CUSTOMER_BRAND_NAME,
} from "@/modules/brand/customer-brand.js";

/** Inline-safe palette aligned with web `:root` (teal primary, mint surfaces). */
export const EMAIL_THEME = {
    font:
        "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    bg: "#f4faf9",
    card: "#ffffff",
    tint: "#eef4f3",
    tintAlt: "#e7f1f0",
    /** Primary CTA + active UI (replaces legacy yellow). */
    primary: "#0f766e",
    primaryFg: "#ffffff",
    primaryDark: "#115e59",
    text: "#0f172a",
    textMuted: "#64748b",
    border: "#e2ecea",
    /** Totals and success accents */
    green: "#16a34a",
    logoUrl: BRAND_LOGO_LIGHT_URL,
    brandName: CUSTOMER_BRAND_NAME,
    footerTagline: "Decorations, delivered with care",
    btnRadius: "12px",
    cardRadius: "16px",
} as const;

export type EmailTheme = typeof EMAIL_THEME;
