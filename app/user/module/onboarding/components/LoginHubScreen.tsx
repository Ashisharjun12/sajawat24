import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { AuthBlockingOverlay } from '@/module/onboarding/components/AuthBlockingOverlay';
import { AuthMethodButton } from '@/module/onboarding/components/AuthMethodButton';
import { AuthOrDivider } from '@/module/onboarding/components/AuthOrDivider';
import { GoogleMark } from '@/module/onboarding/components/GoogleMark';
import {
  BRAND_LOGO_LIGHT_URL,
  BRAND_NAME,
  LOGIN_ILLUSTRATION_URL,
} from '@/module/onboarding/lib/onboarding-copy';
import {
  isErrorWithCode,
  signInWithGoogle,
  statusCodes,
} from '@/module/auth/services/google-auth.service';
import { Href, router } from 'expo-router';
import { Image } from 'expo-image';
import { Phone } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoginHubScreen() {
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      router.replace('/(app)/' as Href);
    } catch (err) {
      setGoogleLoading(false);
      if (isErrorWithCode(err)) {
        if (err.code === statusCodes.SIGN_IN_CANCELLED) {
          return;
        }
        if (err.code === statusCodes.IN_PROGRESS) {
          Alert.alert('Sign-in in progress', 'Please wait for the current sign-in to finish.');
          return;
        }
        if (err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Alert.alert(
            'Google Play Services',
            'Update Google Play Services on this device, then try again.',
          );
          return;
        }
      }
      Alert.alert('Sign-in failed', getApiError(err));
    }
  }

  function handlePhone() {
    if (googleLoading) return;
    router.push('/(onboarding)/sign-in' as Href);
  }

  return (
    <SafeAreaView className="relative flex-1 bg-background">
      <AuthBlockingOverlay visible={googleLoading} message="Loading…" />
      <View className="flex-1 px-6 pb-10 pt-6">
        <View className="flex-row items-center justify-center gap-3">
          <Image
            source={{ uri: BRAND_LOGO_LIGHT_URL }}
            style={{ width: 44, height: 44, borderRadius: 12 }}
            contentFit="contain"
            accessibilityLabel={BRAND_NAME}
          />
          <Text className="text-foreground text-xl font-extrabold tracking-tight">{BRAND_NAME}</Text>
        </View>

        <View className="min-h-0 flex-1 items-center justify-center pt-4">
          <Image
            source={{ uri: LOGIN_ILLUSTRATION_URL }}
            style={{ width: '100%', height: '100%', maxHeight: 420 }}
            contentFit="contain"
            accessibilityLabel="Sign in to your account"
          />
        </View>

        <View className="items-center pb-2 pt-2">
          <Text
            className="text-center text-foreground"
            style={{ fontSize: 28, lineHeight: 34, fontWeight: '700' }}>
            Log in to your account
          </Text>

          <View className="mt-6 w-full max-w-[340px] gap-3 self-center">
            <AuthMethodButton
              label="Continue with Google"
              icon={<GoogleMark />}
              loading={googleLoading}
              loadingLabel="Loading…"
              onPress={() => void handleGoogle()}
            />
            <AuthOrDivider />
            <AuthMethodButton
              tone="primary"
              label="Continue with number"
              icon={<Icon as={Phone} className="text-primary-foreground size-5" />}
              disabled={googleLoading}
              onPress={handlePhone}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
