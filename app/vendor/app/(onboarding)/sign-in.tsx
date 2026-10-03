import { Text } from '@/components/ui/text';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { IndiaPhoneField } from '@/module/onboarding/components/IndiaPhoneField';
import {
  signInSchema,
  type SignInFormValues,
} from '@/module/onboarding/schemas/sign-in.schema';
import { useAuthStore } from '@/store/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignInScreen() {
  const setPendingOtp = useAuthStore((s) => s.setPendingOtp);
  const setPendingLoginIntent = useAuthStore((s) => s.setPendingLoginIntent);
  const pendingLoginIntent = useAuthStore((s) => s.pendingLoginIntent);
  const isStaff = pendingLoginIntent === 'staff';

  useFocusEffect(
    useCallback(() => {
      if (!pendingLoginIntent) {
        router.replace('/(onboarding)/login-choice' as Href);
      }
    }, [pendingLoginIntent]),
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  function onSubmit(values: SignInFormValues) {
    setPendingOtp({
      phone: values.phone,
      mode: 'sign-in',
      loginIntent: pendingLoginIntent,
    });
    router.push('/(onboarding)/verify-otp' as Href);
  }

  function goRegister() {
    // Keep login intent until we leave sign-in; clearing it here re-triggers the
    // focus guard below and sends users back to login-choice before register opens.
    router.replace('/(onboarding)/register' as Href);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthTopBar
        backHref={'/(onboarding)/login-choice' as Href}
        trailingLabel={isStaff ? undefined : 'Sign up'}
        onTrailingPress={isStaff ? undefined : goRegister}
        showHelp={isStaff}
      />
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
              className="text-foreground"
              style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
              {isStaff ? 'Staff sign in' : 'Vendor sign in'}
            </Text>
            <Text className="text-muted-foreground text-base leading-6">
              {isStaff
                ? 'Use the phone number your shop owner added in Team.'
                : 'Enter the phone number linked to your partner shop.'}
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

            <View className="gap-4">
              <OnboardingButton
                disabled={!isValid || isSubmitting}
                onPress={handleSubmit(onSubmit)}>
                <Text>Send OTP</Text>
              </OnboardingButton>

              {!isStaff ? (
                <Text className="text-muted-foreground text-center text-sm leading-5">
                  New to Decoryy?{' '}
                  <Text
                    className="text-foreground font-semibold"
                    onPress={goRegister}
                    accessibilityRole="link">
                    Register your shop
                  </Text>
                </Text>
              ) : null}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
