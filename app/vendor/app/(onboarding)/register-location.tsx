import { registerGeoErrorMessage } from '@/lib/register-geo-error';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShopLocationPicker } from '@/module/onboarding/components/ShopLocationPicker';
import { Text } from '@/components/ui/text';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { CitySelect } from '@/module/onboarding/components/CitySelect';
import { ShopImageField } from '@/module/onboarding/components/ShopImageField';
import { StateSelect } from '@/module/onboarding/components/StateSelect';
import { RegisterLocationGeoSkeleton } from '@/module/onboarding/components/skeletons/RegisterLocationFormSkeleton';
import { useGeoCities } from '@/module/onboarding/hooks/use-geo-cities';
import { getCityById } from '@/module/onboarding/lib/geo';
import {
  submitVendorReapply,
  submitVendorRegistration,
} from '@/module/onboarding/services/register.service';
import {
  registerLocationSchema,
  type RegisterLocationFormValues,
} from '@/module/onboarding/schemas/register-location.schema';
import type { RegisterBasicPayload, RegisterPayload } from '@/store/auth.store';
import { useAuthStore } from '@/store/auth.store';
import { zodResolver } from '@hookform/resolvers/zod';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function getBasicPayload(
  registerDraft: RegisterBasicPayload | null,
  pendingRegistration: RegisterPayload | null
): RegisterBasicPayload | null {
  if (registerDraft) return registerDraft;
  if (!pendingRegistration) return null;
  return {
    name: pendingRegistration.name,
    email: pendingRegistration.email,
    phone: pendingRegistration.phone,
    altPhone: pendingRegistration.altPhone,
  };
}

export default function RegisterLocationScreen() {
  const registerDraft = useAuthStore((s) => s.registerDraft);
  const pendingRegistration = useAuthStore((s) => s.pendingRegistration);
  const isReapplyMode = useAuthStore((s) => s.isReapplyMode);
  const setPendingRegistration = useAuthStore((s) => s.setPendingRegistration);
  const setPendingOtp = useAuthStore((s) => s.setPendingOtp);
  const completeReapply = useAuthStore((s) => s.completeReapply);
  const { cities, states, loading, error: geoError, refetch: refetchGeo } = useGeoCities();
  const [submitError, setSubmitError] = useState('');

  const canAccessScreen = Boolean(registerDraft || pendingRegistration);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterLocationFormValues>({
    resolver: zodResolver(registerLocationSchema),
    mode: 'onChange',
    defaultValues: {
      state: '',
      cityId: '',
      shopAddress: '',
      pincode: '',
      shopImageUri: undefined,
      baseLatitude: undefined,
      baseLongitude: undefined,
    },
  });

  const selectedState = watch('state');

  useFocusEffect(
    useCallback(() => {
      if (!registerDraft && !pendingRegistration) {
        router.replace(
          (isReapplyMode ? '/(gate)/rejected' : '/(onboarding)/register') as Href
        );
        return;
      }

      if (pendingRegistration) {
        reset({
          state: pendingRegistration.state,
          cityId: pendingRegistration.cityId,
          shopAddress: pendingRegistration.shopAddress,
          pincode: pendingRegistration.pincode,
          shopImageUri: pendingRegistration.shopImageUri,
        });
      }
    }, [isReapplyMode, pendingRegistration, registerDraft, reset])
  );

  function handleStateChange(state: string) {
    setValue('state', state, { shouldValidate: true });
    setValue('cityId', '', { shouldValidate: true });
  }

  async function onSubmit(values: RegisterLocationFormValues) {
    const basic = getBasicPayload(registerDraft, pendingRegistration);
    if (!basic) {
      router.replace('/(onboarding)/register' as Href);
      return;
    }

    const city = getCityById(values.cityId, cities);
    if (!city) {
      setSubmitError('Select a valid city');
      return;
    }

    const payload: RegisterPayload = {
      ...basic,
      state: values.state,
      cityId: values.cityId,
      cityName: city.name,
      shopAddress: values.shopAddress.trim(),
      pincode: values.pincode,
      shopImageUri: values.shopImageUri,
      baseLatitude: values.baseLatitude,
      baseLongitude: values.baseLongitude,
    };

    setSubmitError('');

    if (isReapplyMode) {
      try {
        const result = await submitVendorReapply(payload);
        completeReapply(result.user);
        router.replace('/(gate)/pending' as Href);
      } catch (err) {
        setSubmitError(registerGeoErrorMessage(err));
      }
      return;
    }

    try {
      const otpResult = await submitVendorRegistration({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        altPhone: payload.altPhone,
        cityId: payload.cityId,
        shopAddress: payload.shopAddress,
        pincode: payload.pincode,
        shopImageUri: payload.shopImageUri,
        baseLatitude: payload.baseLatitude,
        baseLongitude: payload.baseLongitude,
      });

      const pendingWithUpload: RegisterPayload = {
        ...payload,
        shopImageUploadId: otpResult.shopImageUploadId,
        shopImageUri: undefined,
      };
      setPendingRegistration(pendingWithUpload);
      setPendingOtp({
        phone: basic.phone,
        mode: 'register',
        devOtp: otpResult.otp,
        registerOtpRequested: true,
      });
      router.push('/(onboarding)/verify-otp' as Href);
    } catch (err) {
      setSubmitError(registerGeoErrorMessage(err));
    }
  }

  if (!canAccessScreen) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <AuthTopBar
        backHref={
          isReapplyMode ? ('/(onboarding)/register' as Href) : ('/(onboarding)/register' as Href)
        }
      />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-8 pb-6 pt-4"
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          overScrollMode="never">
          <View className="mb-8 gap-2">
            <Text className="text-foreground" style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
              {isReapplyMode ? 'Update shop location' : 'Shop location'}
            </Text>
            <Text className="text-muted-foreground text-base leading-6">
              {isReapplyMode
                ? 'Confirm or update where customers can find your decoration business.'
                : 'Where customers can find your decoration business.'}
            </Text>
          </View>

          <View className="gap-5">
            {loading ? (
              <RegisterLocationGeoSkeleton />
            ) : geoError ? (
              <View className="border-destructive/30 bg-destructive/5 gap-3 rounded-2xl border p-4">
                <Text className="text-foreground text-sm leading-5">
                  Could not load states and cities. Check your connection and try again.
                </Text>
                <Text className="text-muted-foreground text-xs">{geoError}</Text>
                <Pressable onPress={refetchGeo}>
                  <Text className="text-foreground text-sm font-semibold underline">Retry</Text>
                </Pressable>
              </View>
            ) : states.length === 0 ? (
              <View className="border-input gap-2 rounded-2xl border p-4">
                <Text className="text-foreground text-sm leading-5">
                  No cities are available yet. Ask support to add your city in admin.
                </Text>
              </View>
            ) : (
              <>
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { value } }) => (
                    <StateSelect
                      value={value}
                      states={states}
                      onValueChange={handleStateChange}
                      error={errors.state?.message}
                    />
                  )}
                />

                <Controller
                  control={control}
                  name="cityId"
                  render={({ field: { value, onChange } }) => (
                    <CitySelect
                      state={selectedState}
                      value={value}
                      cities={cities}
                      onValueChange={onChange}
                      error={errors.cityId?.message}
                    />
                  )}
                />
              </>
            )}

            <Controller
              control={control}
              name="shopAddress"
              render={({ field: { onChange, value } }) => (
                <ShopLocationPicker
                  address={value}
                  pincode={watch('pincode')}
                  pin={
                    watch('baseLatitude') != null && watch('baseLongitude') != null
                      ? {
                          latitude: watch('baseLatitude') as number,
                          longitude: watch('baseLongitude') as number,
                        }
                      : null
                  }
                  onAddressChange={onChange}
                  onPincodeChange={(next) => setValue('pincode', next, { shouldValidate: true })}
                  onPinChange={({ latitude, longitude }) => {
                    setValue('baseLatitude', latitude, { shouldValidate: true });
                    setValue('baseLongitude', longitude, { shouldValidate: true });
                  }}
                  error={
                    errors.shopAddress?.message ??
                    errors.baseLatitude?.message ??
                    errors.baseLongitude?.message
                  }
                />
              )}
            />

            <View className="gap-2">
              <Label nativeID="pincode">Pincode</Label>
              <Controller
                control={control}
                name="pincode"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    nativeID="pincode"
                    placeholder="6-digit pincode"
                    value={value}
                    onChangeText={(text) => onChange(text.replace(/\D/g, '').slice(0, 6))}
                    onBlur={onBlur}
                    keyboardType="number-pad"
                    maxLength={6}
                    className="h-12 rounded-xl"
                  />
                )}
              />
              {errors.pincode ? (
                <Text className="text-destructive text-sm">{errors.pincode.message}</Text>
              ) : null}
            </View>

            <Controller
              control={control}
              name="shopImageUri"
              render={({ field: { value, onChange } }) => (
                <ShopImageField value={value} onChange={onChange} />
              )}
            />

            {submitError ? (
              <Text className="text-destructive text-sm">{submitError}</Text>
            ) : null}
          </View>
        </ScrollView>

        <View className="px-8 pb-10 pt-4">
          <OnboardingButton
            disabled={!isValid || isSubmitting || loading || Boolean(geoError) || states.length === 0}
            onPress={handleSubmit(onSubmit)}>
            <Text>{isSubmitting ? 'Submitting…' : isReapplyMode ? 'Submit application' : 'Continue'}</Text>
          </OnboardingButton>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
