import { loadAppTheme } from '@/lib/secure-storage';
import { DEFAULT_APP_THEME, isAppTheme } from '@/module/settings/lib/theme-preference';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';

/** Applies saved app theme on boot — defaults to light, never system. */
export function ThemeBootstrap() {
  const { setColorScheme } = useColorScheme();

  useEffect(() => {
    void loadAppTheme().then((saved) => {
      const theme = isAppTheme(saved) ? saved : DEFAULT_APP_THEME;
      setColorScheme(theme);
    });
  }, [setColorScheme]);

  return null;
}
