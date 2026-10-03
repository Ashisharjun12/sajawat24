/** Inline-safe palette aligned with web app primary (amber) tokens */
export const EMAIL_THEME = {
    font:
        "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    bg: "#f6f5f2",
    card: "#ffffff",
    tint: "#fdf8e8",
    tintAlt: "#fff5eb",
    primary: "#f2dc5c",
    primaryFg: "#1c1912",
    text: "#292524",
    textMuted: "#78716c",
    border: "#e7e5e4",
    green: "#047857",
    logoUrl: "https://ik.imagekit.io/aevhlnk0h/decoryy-light.png?updatedAt=1787252402359",
    brandName: "Decoryy",
    footerTagline: "Decorations, delivered with care",
} as const;

export type EmailTheme = typeof EMAIL_THEME;
