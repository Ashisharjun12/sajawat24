import { formatIndiaPhoneDisplay } from '@/lib/phone';
import type { PartnerLoginIntent } from '@/lib/login-intent';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { Text } from '@/components/ui/text';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { OtpInput } from '@/module/onboarding/components/OtpInput';
import { useSmsOtpAutofill } from '@/module/onboarding/hooks/use-sms-otp-autofill';
import { partnerLoginErrorFromUnknown } from '@/module/onboarding/lib/partner-login-errors';
import { mapOtpVerifyError } from '@/module/onboarding/lib/otp-verify-errors';
import { sendSignInOtp, verifyRegisterOtp, verifySignInOtp } from '@/module/onboarding/services/otp.service';
import { submitVendorRegistration } from '@/module/onboarding/services/register.service';
import { getPostOtpRedirectPath, useAuthStore } from '@/store/auth.store';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

function applyVerifyError(
  err: unknown,
  intent: PartnerLoginIntent | null,
  setError: (msg: string) => void,
  setSuggestIntent: (intent: PartnerLoginIntent | null) => void,
  setHighlightResend: (value: boolean) => void,
) {
  const otpMapped = mapOtpVerifyError(err);
  if (otpMapped) {
    setError(otpMapped.message);
    setSuggestIntent(null);
    setHighlightResend(otpMapped.suggestResend);
    return;
  }
  const mapped = partnerLoginErrorFromUnknown(err, intent);
  setError(mapped.message);
  setHighlightResend(false);
  setSuggestIntent(
    mapped.suggestIntent && mapped.suggestIntent !== intent ? mapped.suggestIntent : null,
  );
}

export default function VerifyOtpScreen() {
  const pendingRegistration = useAuthStore((s) => s.pendingRegistration);
  const pendingOtpPhone = useAuthStore((s) => s.pendingOtpPhone);
  const pendingOtpMode = useAuthStore((s) => s.pendingOtpMode);
  const pendingLoginIntent = useAuthStore((s) => s.pendingLoginIntent);
  const registerOtpRequested = useAuthStore((s) => s.registerOtpRequested);
  const setPendingOtp = useAuthStore((s) => s.setPendingOtp);
  const setPendingLoginIntent = useAuthStore((s) => s.setPendingLoginIntent);
  const clearPendingOtp = useAuthStore((s) => s.clearPendingOtp);
  const restoreRegisterDraftFromPending = useAuthStore((s) => s.restoreRegisterDraftFromPending);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [suggestIntent, setSuggestIntent] = useState<PartnerLoginIntent | null>(null);
  const [highlightResend, setHighlightResend] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpReady, setOtpReady] = useState(false);
  const autoVerifyRef = useRef('');
  const otpSendRef = useRef(0);

  const phone = pendingOtpPhone ?? pendingRegistration?.phone;
  const phoneDisplay = phone ? formatIndiaPhoneDisplay(phone) : 'your number';
  const isSignIn = pendingOtpMode === 'sign-in';
  const intentLabel =
    pendingLoginIntent === 'staff'
      ? 'Staff'
      : pendingLoginIntent === 'owner'
        ? 'Vendor partner'
        : null;

  const handleVerify = useCallback(
    async (code: string) => {
      if (!phone || code.length !== 6 || submitting || !otpReady) return;

      setSubmitting(true);
      setError('');
      setSuggestIntent(null);
      setHighlightResend(false);
      try {
        const result =
          isSignIn ? await verifySignInOtp(phone, code) : await verifyRegisterOtp(phone, code);
        router.replace(getPostOtpRedirectPath(result.user) as Href);
      } catch (err) {
        autoVerifyRef.current = '';
        applyVerifyError(err, pendingLoginIntent, setError, setSuggestIntent, setHighlightResend);
      } finally {
        setSubmitting(false);
      }
    },
    [phone, isSignIn, submitting, otpReady, pendingLoginIntent],
  );

  const sendOtpForCurrentFlow = useCallback(async () => {
    if (!phone || !pendingOtpMode) return;
    if (pendingOtpMode === 'sign-in') {
      await sendSignInOtp(phone);
      return;
    }
    const registration = useAuthStore.getState().pendingRegistration;
    if (!registration) {
      throw new Error('Registration details missing. Go back and try again.');
    }
    const result = await submitVendorRegistration(registration);
    setPendingOtp({
      phone,
      mode: 'register',
      devOtp: result.otp,
      registerOtpRequested: true,
    });
    if (result.shopImageUploadId) {
      useAuthStore.getState().setPendingRegistration({
        ...registration,
        shopImageUploadId: result.shopImageUploadId,
        shopImageUri: undefined,
      });
    }
  }, [phone, pendingOtpMode, setPendingOtp]);

  const handleOtpAutofill = useCallback((code: string) => {
    setOtp(code);
    setError('');
    setSuggestIntent(null);
  }, []);

  useSmsOtpAutofill({ onOtpReceived: handleOtpAutofill });

  useEffect(() => {
    if (!phone || !pendingOtpMode) return;

    if (pendingOtpMode === 'register' && registerOtpRequested) {
      setOtpReady(true);
      return;
    }

    const sendId = ++otpSendRef.current;
    let cancelled = false;
    setSendingOtp(true);
    setOtpReady(false);
    setError('');
    setSuggestIntent(null);
    setHighlightResend(false);

    void (async () => {
      try {
        await sendOtpForCurrentFlow();
        if (!cancelled && sendId === otpSendRef.current) {
          setOtpReady(true);
        }
      } catch (err) {
        if (!cancelled && sendId === otpSendRef.current) {
          applyVerifyError(err, pendingLoginIntent, setError, setSuggestIntent, setHighlightResend);
        }
      } finally {
        if (!cancelled && sendId === otpSendRef.current) {
          setSendingOtp(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [phone, pendingOtpMode, registerOtpRequested, pendingLoginIntent, sendOtpForCurrentFlow]);

  useEffect(() => {
    if (otp.length !== 6 || submitting || sendingOtp || !otpReady) return;
    if (autoVerifyRef.current === otp) return;
    autoVerifyRef.current = otp;
    void handleVerify(otp);
  }, [otp, submitting, sendingOtp, otpReady, handleVerify]);

  function handleBack() {
    if (isSignIn) {
      clearPendingOtp();
      router.replace('/(onboarding)/login-choice' as Href);
      return;
    }

    restoreRegisterDraftFromPending();
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(onboarding)/register-location' as Href);
  }

  useFocusEffect(
    useCallback(() => {
      if (!pendingOtpPhone && !pendingRegistration) {
        router.replace('/(onboarding)/login-choice' as Href);
      }
    }, [pendingOtpPhone, pendingRegistration]),
  );

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [isSignIn, pendingRegistration, pendingOtpPhone]);

  async function handleResend() {
    if (!phone || resending || sendingOtp) return;
    setResending(true);
    setError('');
    setSuggestIntent(null);
    setHighlightResend(false);
    setOtp('');
    autoVerifyRef.current = '';
    otpSendRef.current += 1;
    setOtpReady(false);
    try {
      await sendOtpForCurrentFlow();
      if (isSignIn) {
        setPendingOtp({
          phone,
          mode: 'sign-in',
          loginIntent: pendingLoginIntent,
        });
      }
      setOtpReady(true);
    } catch (err) {
      applyVerifyError(err, pendingLoginIntent, setError, setSuggestIntent, setHighlightResend);
    } finally {
      setResending(false);
    }
  }

  async function handleSwitchLogin() {
    if (!suggestIntent || !phone || sendingOtp || resending) return;
    setPendingLoginIntent(suggestIntent);
    setPendingOtp({
      phone,
      mode: 'sign-in',
      loginIntent: suggestIntent,
    });
    setOtp('');
    setError('');
    setSuggestIntent(null);
    setHighlightResend(false);
    autoVerifyRef.current = '';
    setOtpReady(false);
    setResending(true);
    try {
      await sendSignInOtp(phone);
      setOtpReady(true);
    } catch (err) {
      applyVerifyError(err, suggestIntent, setError, setSuggestIntent, setHighlightResend);
    } finally {
      setResending(false);
    }
  }

  const statusLine = sendingOtp
    ? 'Sending verification code…'
    : resending
      ? 'Sending a new code…'
      : null;

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthTopBar onBackPress={handleBack} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="flex-grow px-8 pb-8 pt-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View className="mb-8 gap-3">
            <Text
              className="text-foreground"
              style={{ fontSize: 32, lineHeight: 38, fontWeight: '700' }}>
              We just sent you an SMS
            </Text>
            {isSignIn && intentLabel ? (
              <Text className="text-primary text-sm font-medium">
                Signing in as {intentLabel}
              </Text>
            ) : null}
            <Text className="text-muted-foreground text-base leading-6">
              Enter the security code we sent to{'\n'}
              {phoneDisplay}
            </Text>
          </View>

          <View className="gap-6">
            <OtpInput
              value={otp}
              onChange={(value) => {
                autoVerifyRef.current = '';
                setOtp(value);
                setError('');
                setSuggestIntent(null);
                setHighlightResend(false);
              }}
            />

            {statusLine ? (
              <Text className="text-muted-foreground text-sm">{statusLine}</Text>
            ) : null}

            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}

            {suggestIntent && isSignIn ? (
              <OnboardingButton variant="outline" onPress={() => void handleSwitchLogin()}>
                <Text>
                  {suggestIntent === 'staff'
                    ? 'Use staff login instead'
                    : 'Use vendor partner login instead'}
                </Text>
              </OnboardingButton>
            ) : null}

            <Pressable
              className="self-start"
              disabled={resending || sendingOtp}
              onPress={() => void handleResend()}>
              <Text
                className={
                  highlightResend
                    ? 'text-primary text-sm font-semibold underline'
                    : 'text-foreground text-sm underline'
                }>
                {resending || sendingOtp ? 'Please wait…' : "Didn't receive a code?"}
              </Text>
            </Pressable>

            <View className="gap-4">
              <OnboardingButton
                disabled={otp.length !== 6 || submitting || sendingOtp || !otpReady}
                onPress={() => void handleVerify(otp)}>
                <Text>{submitting ? 'Verifying…' : 'Continue'}</Text>
              </OnboardingButton>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
