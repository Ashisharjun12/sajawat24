import { saveAppTheme } from '@/lib/secure-storage';
import { APP_THEME_LABELS, type AppTheme } from '@/module/settings/lib/theme-preference';
import { useColorScheme } from 'nativewind';
import { useCallback } from 'react';

export function useAppTheme() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const theme: AppTheme = colorScheme === 'dark' ? 'dark' : 'light';

  const setTheme = useCallback(
    async (next: AppTheme) => {
      await saveAppTheme(next);
      setColorScheme(next);
    },
    [setColorScheme],
  );

  return {
    theme,
    themeLabel: APP_THEME_LABELS[theme],
    setTheme,
  };
}
