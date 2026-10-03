import { Text } from '@/components/ui/text';
import { AuthBlockingOverlay } from '@/module/onboarding/components/AuthBlockingOverlay';
import { AuthTopBar } from '@/module/onboarding/components/AuthTopBar';
import { OnboardingButton } from '@/module/onboarding/components/OnboardingButton';
import { OtpInput } from '@/module/onboarding/components/OtpInput';
import { useSmsOtpAutofill } from '@/module/onboarding/hooks/use-sms-otp-autofill';
import { consumerSessionErrorMessage } from '@/module/auth/lib/consumer-session';
import { mapOtpVerifyError } from '@/module/onboarding/lib/otp-verify-errors';
import {
  sendSignInOtp,
  verifySignInOtp,
} from '@/module/onboarding/services/otp.service';
import { formatIndiaPhoneDisplay } from '@/lib/phone';
import { useAuthStore } from '@/store/auth.store';
import * as Haptics from 'expo-haptics';
import { Href, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const RESEND_COOLDOWN_SEC = 30;

function applyVerifyError(err: unknown, setError: (msg: string) => void) {
  const mapped = mapOtpVerifyError(err);
  if (mapped) {
    setError(mapped.message);
    return;
  }
  setError(consumerSessionErrorMessage(err));
}

export default function VerifyOtpScreen() {
  const pendingOtpPhone = useAuthStore((s) => s.pendingOtpPhone);
  const lastDevOtp = useAuthStore((s) => s.lastDevOtp);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const attemptedOtpRef = useRef('');
  const verifyInFlightRef = useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!pendingOtpPhone) {
        router.replace('/(onboarding)/login' as Href);
      }
    }, [pendingOtpPhone]),
  );

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const phone = pendingOtpPhone ?? '';
  const phoneLabel = phone ? formatIndiaPhoneDisplay(phone) : '';

  const handleVerify = useCallback(
    async (code: string) => {
      if (!phone || code.length < 6 || submitting || verifyInFlightRef.current) return;
      if (attemptedOtpRef.current === code) return;

      verifyInFlightRef.current = true;
      attemptedOtpRef.current = code;
      setSubmitting(true);
      setError('');
      try {
        await verifySignInOtp(phone, code);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace('/(app)/' as Href);
        return;
      } catch (err) {
        applyVerifyError(err, setError);
        verifyInFlightRef.current = false;
        setSubmitting(false);
      }
    },
    [phone, submitting],
  );

  const handleOtpAutofill = useCallback((code: string) => {
    setOtp(code);
    setError('');
  }, []);

  useSmsOtpAutofill({ onOtpReceived: handleOtpAutofill });

  useEffect(() => {
    if (otp.length !== 6 || submitting) return;
    void handleVerify(otp);
  }, [otp, submitting, handleVerify]);

  async function handleResend() {
    if (!phone || resendCooldown > 0) return;
    setResending(true);
    setResendMessage('');
    setError('');
    attemptedOtpRef.current = '';
    try {
      await sendSignInOtp(phone);
      setResendMessage('OTP sent.');
      setOtp('');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      applyVerifyError(err, setError);
    } finally {
      setResending(false);
    }
  }

  if (!pendingOtpPhone) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <AuthBlockingOverlay visible={submitting} message="Verifying your code" />
      <AuthTopBar backHref={'/(onboarding)/sign-in' as Href} />
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
              Verify OTP
            </Text>
            <Text className="text-muted-foreground text-base leading-6">
              Enter the code sent to {phoneLabel}.
            </Text>
            {__DEV__ && lastDevOtp ? (
              <Text className="text-muted-foreground text-xs">Dev OTP: {lastDevOtp}</Text>
            ) : null}
          </View>

          <View className="gap-6">
            <OtpInput
              value={otp}
              onChange={(value) => {
                if (value !== attemptedOtpRef.current) {
                  attemptedOtpRef.current = '';
                }
                setOtp(value);
                setError('');
              }}
            />

            {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
            {resendMessage ? (
              <Text className="text-muted-foreground text-sm">{resendMessage}</Text>
            ) : null}

            <OnboardingButton disabled={submitting || otp.length < 6} onPress={() => void handleVerify(otp)}>
              <Text>{submitting ? 'Verifying…' : 'Verify'}</Text>
            </OnboardingButton>

            <Pressable
              onPress={() => void handleResend()}
              disabled={resending || resendCooldown > 0}
              accessibilityRole="button"
              className="self-center py-2">
              <Text className="text-foreground text-sm font-semibold">
                {resending
                  ? 'Sending…'
                  : resendCooldown > 0
                    ? `Resend OTP (${resendCooldown}s)`
                    : 'Resend OTP'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
