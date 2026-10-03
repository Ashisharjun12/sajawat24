export type AppTheme = 'light' | 'dark';

export const DEFAULT_APP_THEME: AppTheme = 'light';

export const APP_THEME_LABELS: Record<AppTheme, string> = {
  light: 'Light',
  dark: 'Dark',
};

export function isAppTheme(value: string | null | undefined): value is AppTheme {
  return value === 'light' || value === 'dark';
}
