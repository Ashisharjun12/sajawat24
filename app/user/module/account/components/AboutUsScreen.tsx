import { Text } from '@/components/ui/text';
import { AccountSubScreen } from '@/module/account/components/AccountSubScreen';
import Constants from 'expo-constants';
import { View } from 'react-native';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';

export function AboutUsScreen() {
  return (
    <AccountSubScreen title="About us">
      <View className="gap-4">
        <Text className="text-foreground text-h2 font-semibold">Sajawat24</Text>
        <Text className="text-muted-foreground text-body leading-6">
          City-priced decoration setups — balloons, backdrops, and lights, dressed for the room you
          have. Book online, track your order, and chat with support when you need help.
        </Text>
        <Text className="text-muted-foreground text-body leading-6">
          We work with local crews so you see real prices and delivery options for your area before
          you pay.
        </Text>
        <Text className="text-muted-foreground text-caption">App version {APP_VERSION}</Text>
      </View>
    </AccountSubScreen>
  );
}
