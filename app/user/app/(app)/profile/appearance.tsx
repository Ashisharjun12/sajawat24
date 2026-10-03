import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import { AppThemeOptions } from '@/module/settings/components/AppThemeOptions';

export default function ProfileAppearanceRoute() {
  return (
    <AccountSubScreen title="Appearance">
      <Text className="text-muted-foreground -mt-2 text-sm">
        Choose how DeccorBuddys looks on your device. The app starts in light mode unless you pick
        dark.
      </Text>
      <AppThemeOptions />
    </AccountSubScreen>
  );
}
