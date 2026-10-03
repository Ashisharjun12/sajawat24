import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { AuthBlockingOverlay } from '@/module/onboarding/components/AuthBlockingOverlay';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { IndiaPhoneField } from '@/module/onboarding/components/IndiaPhoneField';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import {
  signInSchema,
  type SignInFormValues,
} from '@/module/onboarding/schemas/sign-in.schema';
import { sendSignInOtp } from '@/module/onboarding/services/otp.service';
import { useAuthStore } from '@/store/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const setPendingOtp = useAuthStore((s) => s.setPendingOtp);
  const [sending, setSending] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  async function onSubmit(values: SignInFormValues) {
    setSending(true);
    try {
      setPendingOtp(values.phone);
      await sendSignInOtp(values.phone);
      router.push('/(onboarding)/verify-otp' as Href);
      return;
    } catch (err) {
      setSending(false);
      Alert.alert('Could not send OTP', getApiError(err));
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthBlockingOverlay visible={sending} message="Sending OTP to your number" />
      <AuthTopBar backHref={'/(onboarding)/login' as Href} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-8 pb-8 pt-4"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 gap-2">
            <Text
              className="text-left text-foreground"
              style={{ fontSize: 30, lineHeight: 36, fontWeight: '700' }}>
              Log in with phone
            </Text>
            <Text className="text-muted-foreground text-left text-base leading-6">
              We&apos;ll send a one-time code to verify your number.
            </Text>
          </View>

          <View className="gap-6">
            <IndiaPhoneField
              label="Phone number"
              nativeID="signInPhone"
              placeholder="Mobile number"
              control={control}
              name="phone"
              error={errors.phone?.message}
            />

            <OnboardingButton
              disabled={!isValid || sending}
              onPress={handleSubmit(onSubmit)}>
              <Text>{sending ? 'Sending…' : 'Send OTP'}</Text>
            </OnboardingButton>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
