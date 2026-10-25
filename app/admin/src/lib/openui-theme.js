import { createTheme } from "@openuidev/react-ui"

/** Maps admin CSS variables so OpenUI follows light/dark with the rest of the app. */
export const sajawatOpenUiTheme = createTheme({
  background: "var(--background)",
  foreground: "var(--card)",
  popoverBackground: "var(--popover)",
  textNeutralPrimary: "var(--foreground)",
  textNeutralSecondary: "var(--muted-foreground)",
  textNeutralTertiary: "var(--muted-foreground)",
  interactiveAccentDefault: "var(--primary)",
  interactiveAccentHover: "var(--brand-primary-hover)",
  interactiveAccentPressed: "var(--brand-primary)",
  textAccentPrimary: "var(--primary-foreground)",
  borderDefault: "var(--border)",
  borderInteractive: "var(--border)",
  invertedBackground: "var(--foreground)",
  chatUserResponseBg: "var(--muted)",
  chatUserResponseText: "var(--foreground)",
  radiusM: "12px",
  fontBody: "var(--font-sans)",
  fontHeading: "var(--font-heading)",
})
