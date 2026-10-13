import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { HomeBottomSheetModal } from '@/module/home/components/HomeBottomSheetModal';
import { AppThemeOptions } from '@/module/settings/components/AppThemeOptions';
import { useAppTheme } from '@/module/settings/hooks/use-app-theme';
import type { AppTheme } from '@/module/settings/lib/theme-preference';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

type AppearanceSheetProps = {
  visible: boolean;
  onClose: () => void;
};

export function AppearanceSheet({ visible, onClose }: AppearanceSheetProps) {
  const { theme, setTheme } = useAppTheme();
  const [draft, setDraft] = useState<AppTheme>(theme);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(theme);
    }
  }, [visible, theme]);

  async function handleSave() {
    if (saving) return;
    setSaving(true);
    try {
      await setTheme(draft);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <HomeBottomSheetModal
      visible={visible}
      onClose={onClose}
      closeAccessibilityLabel="Close appearance">
      <View className="gap-5 px-4">
        <View className="gap-1">
          <Text className="text-foreground text-h2 font-semibold">Appearance</Text>
          <Text className="text-muted-foreground text-body">
            Choose light or dark mode. The app starts in light unless you pick dark.
          </Text>
        </View>
        <AppThemeOptions value={draft} onChange={setDraft} />
        <Button variant="primary" className="w-full" loading={saving} onPress={() => void handleSave()}>
          <Text>Save preference</Text>
        </Button>
      </View>
    </HomeBottomSheetModal>
  );
}
