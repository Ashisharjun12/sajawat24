import { PressableScale } from '@/components/motion';
import { IconWell } from '@/components/shell';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAppTheme } from '@/module/settings/hooks/use-app-theme';
import { APP_THEME_LABELS, type AppTheme } from '@/module/settings/lib/theme-preference';
import { Moon, Sun } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

const THEME_OPTIONS: AppTheme[] = ['light', 'dark'];

const THEME_ICONS: Record<AppTheme, LucideIcon> = {
  light: Sun,
  dark: Moon,
};

export function AppThemeOptions() {
  const { theme, setTheme } = useAppTheme();

  return (
    <View className="gap-2 px-1">
      {THEME_OPTIONS.map((option) => {
        const selected = theme === option;
        return (
          <PressableScale
            key={option}
            onPress={() => void setTheme(option)}
            scaleTo={0.98}>
            <View
              className={cn(
                'flex-row items-center justify-between rounded-2xl border px-4 py-3.5',
                selected ? 'border-primary bg-primary/8' : 'border-border bg-card',
              )}>
              <View className="flex-row items-center gap-3">
                <IconWell icon={THEME_ICONS[option]} size="sm" />
                <Text className="text-foreground text-base font-medium">
                  {APP_THEME_LABELS[option]}
                </Text>
              </View>
              <View
                className={cn(
                  'size-5 items-center justify-center rounded-full border-2',
                  selected ? 'border-primary' : 'border-muted-foreground/40',
                )}>
                {selected ? <View className="bg-primary size-2.5 rounded-full" /> : null}
              </View>
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}
