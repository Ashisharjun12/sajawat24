import { Text } from '@/components/ui/text';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { LOGIN_CHOICE_IMAGE_URL } from '@/module/onboarding/lib/onboarding-copy';
import { useAuthStore } from '@/store/auth.store';
import { Image } from 'expo-image';
import { Href, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginChoiceScreen() {
  const setPendingLoginIntent = useAuthStore((s) => s.setPendingLoginIntent);

  function goVendorLogin() {
    setPendingLoginIntent('owner');
    router.push('/(onboarding)/sign-in' as Href);
  }

  function goStaffLogin() {
    setPendingLoginIntent('staff');
    router.push('/(onboarding)/sign-in' as Href);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 px-8 pb-10">
        <View className="flex-1 items-center justify-center">
          <Image
            source={{ uri: LOGIN_CHOICE_IMAGE_URL }}
            accessibilityLabel="Team collaboration"
            contentFit="contain"
            style={styles.heroImage}
          />
        </View>

        <View className="gap-8">
          <View className="max-w-[340px] gap-3 self-center">
            <Text
              className="text-center text-foreground"
              style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
              Welcome back
            </Text>
            <Text className="text-muted-foreground text-center text-base leading-6">
              Choose how you use Decoryy Partner. We&apos;ll send a one-time code to your phone.
            </Text>
          </View>

          <View className="gap-3">
            <OnboardingButton onPress={goVendorLogin}>
              <Text className="font-semibold">Login with vendor partner</Text>
            </OnboardingButton>
            <OnboardingButton variant="outline" onPress={goStaffLogin}>
              <Text className="font-semibold">Login with staff</Text>
            </OnboardingButton>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  heroImage: {
    width: '100%',
    maxWidth: 280,
    height: 220,
    alignSelf: 'center',
  },
});
