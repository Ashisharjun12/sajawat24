import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Text } from '@/components/ui/text';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { IndiaPhoneField } from '@/module/onboarding/components/IndiaPhoneField';
import {
  registerSchema,
  type RegisterFormValues,
} from '@/module/onboarding/schemas/register.schema';
import { useAuthStore } from '@/store/auth.store';
import { toLocalPhone } from '@/lib/phone';
import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router, useFocusEffect } from 'expo-router';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback } from 'react';

export default function RegisterScreen() {
  const setRegisterDraft = useAuthStore((s) => s.setRegisterDraft);
  const setPendingRegistration = useAuthStore((s) => s.setPendingRegistration);
  const registerDraft = useAuthStore((s) => s.registerDraft);
  const pendingRegistration = useAuthStore((s) => s.pendingRegistration);
  const isReapplyMode = useAuthStore((s) => s.isReapplyMode);
  const {
    control,
    handleSubmit,
    reset,
    trigger,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: {
      name: registerDraft?.name ?? '',
      email: registerDraft?.email ?? '',
      phone: registerDraft?.phone ? toLocalPhone(registerDraft.phone) : '',
      altPhone: registerDraft?.altPhone ? toLocalPhone(registerDraft.altPhone) : '',
    },
  });

  useFocusEffect(
    useCallback(() => {
      if (isReapplyMode && !registerDraft && !pendingRegistration) {
        router.replace('/(gate)/rejected' as Href);
        return;
      }
      if (!registerDraft) return;

      const values = {
        name: registerDraft.name,
        email: registerDraft.email,
        phone: toLocalPhone(registerDraft.phone),
        altPhone: registerDraft.altPhone ? toLocalPhone(registerDraft.altPhone) : '',
      };
      reset(values);
      void trigger();
    }, [isReapplyMode, pendingRegistration, registerDraft, reset, trigger])
  );

  function onSubmit(values: RegisterFormValues) {
    const draft = {
      name: values.name,
      email: values.email,
      phone: values.phone,
      altPhone: values.altPhone?.trim() ? values.altPhone.trim() : undefined,
    };
    setRegisterDraft(draft);
    if (isReapplyMode && pendingRegistration) {
      setPendingRegistration({ ...pendingRegistration, ...draft });
    }
    router.push('/(onboarding)/register-location' as Href);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthTopBar
        backHref={
          isReapplyMode ? ('/(gate)/rejected' as Href) : ('/(onboarding)/welcome' as Href)
        }
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="grow px-8 pb-6 pt-4"
          keyboardShouldPersistTaps="handled">
          <View className="mb-8 gap-2">
            <Text className="text-foreground" style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
              {isReapplyMode ? 'Update your application' : 'Join us as a vendor'}
            </Text>
            <Text className="text-muted-foreground text-base leading-6">
              {isReapplyMode
                ? 'Review your details and update anything that needs correction.'
                : 'Tell us how to reach you. Next, add your shop location.'}
            </Text>
          </View>

          <View className="gap-5">
            <View className="gap-2">
              <Label nativeID="name">Full name</Label>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    nativeID="name"
                    placeholder="Your full name"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    autoCapitalize="words"
                    className="h-12 rounded-xl"
                  />
                )}
              />
              {errors.name ? (
                <Text className="text-destructive text-sm">{errors.name.message}</Text>
              ) : null}
            </View>

            <View className="gap-2">
              <Label nativeID="email">Email</Label>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    nativeID="email"
                    placeholder="you@example.com"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    className="h-12 rounded-xl"
                  />
                )}
              />
              {errors.email ? (
                <Text className="text-destructive text-sm">{errors.email.message}</Text>
              ) : null}
            </View>

            <IndiaPhoneField
              label="Phone number"
              nativeID="phone"
              control={control}
              name="phone"
              error={errors.phone?.message}
              editable={!isReapplyMode}
            />
            {isReapplyMode ? (
              <Text className="text-muted-foreground -mt-3 text-xs">
                Phone number is verified and cannot be changed.
              </Text>
            ) : null}

            <IndiaPhoneField
              label="Alternative phone"
              nativeID="altPhone"
              control={control}
              name="altPhone"
              error={errors.altPhone?.message}
              optional
            />
          </View>
        </ScrollView>

        <View className="gap-3 px-8 pb-10 pt-4">
          <OnboardingButton
            disabled={!isValid || isSubmitting}
            onPress={handleSubmit(onSubmit)}>
            <Text>Continue</Text>
          </OnboardingButton>
          {!isReapplyMode ? (
            <View className="flex-row items-center justify-center gap-1">
              <Text className="text-muted-foreground text-sm">Already registered?</Text>
              <Text
                className="text-foreground text-sm font-semibold underline"
                onPress={() => router.push('/(onboarding)/login-choice' as Href)}>
                Sign in
              </Text>
            </View>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
