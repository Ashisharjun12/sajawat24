import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Text } from '@/components/ui/text';
import { getApiError } from '@/api/client';
import { IndiaPhoneField } from '@/module/onboarding/components/IndiaPhoneField';
import { OtpInput } from '@/module/onboarding/components/OtpInput';
import { useSmsOtpAutofill } from '@/module/onboarding/hooks/use-sms-otp-autofill';
import { mapOtpVerifyError } from '@/module/onboarding/lib/otp-verify-errors';
import {
  signInSchema,
  type SignInFormValues,
} from '@/module/onboarding/schemas/sign-in.schema';
import {
  confirmLinkPhone,
  sendLinkPhoneOtp,
} from '@/module/account/services/link-phone.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { View } from 'react-native';

const RESEND_COOLDOWN_SEC = 30;

type LinkPhoneDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function mapLinkError(err: unknown): string {
  const otpMapped = mapOtpVerifyError(err);
  if (otpMapped) return otpMapped.message;
  const raw = getApiError(err);
  if (raw.toLowerCase().includes('already registered')) {
    return 'This number is already on another account. Log in with that number instead.';
  }
  return raw;
}

export function LinkPhoneDialog({ open, onOpenChange }: LinkPhoneDialogProps) {
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const attemptedOtpRef = useRef('');
  const verifyInFlightRef = useRef(false);

  const { control, handleSubmit, formState, reset } = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: { phone: '' },
  });

  useEffect(() => {
    if (!open) {
      setStep('phone');
      setPhone('');
      setOtp('');
      setError('');
      setResendCooldown(0);
      attemptedOtpRef.current = '';
      reset({ phone: '' });
    }
  }, [open, reset]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const submitOtp = useCallback(
    async (code: string) => {
      if (!phone || code.length < 6 || pending || verifyInFlightRef.current) return;
      if (attemptedOtpRef.current === code) return;

      verifyInFlightRef.current = true;
      attemptedOtpRef.current = code;
      setPending(true);
      setError('');
      try {
        await confirmLinkPhone(phone, code);
        onOpenChange(false);
      } catch (err) {
        setError(mapLinkError(err));
      } finally {
        verifyInFlightRef.current = false;
        setPending(false);
      }
    },
    [phone, pending, onOpenChange],
  );

  useSmsOtpAutofill({
    onOtpReceived: (code) => {
      if (step === 'otp') {
        setOtp(code);
        setError('');
      }
    },
  });

  useEffect(() => {
    if (step !== 'otp' || otp.length !== 6 || pending) return;
    void submitOtp(otp);
  }, [step, otp, pending, submitOtp]);

  async function onSendOtp(values: SignInFormValues) {
    setPending(true);
    setError('');
    try {
      await sendLinkPhoneOtp(values.phone);
      setPhone(values.phone);
      setStep('otp');
      setOtp('');
      attemptedOtpRef.current = '';
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(mapLinkError(err));
    } finally {
      setPending(false);
    }
  }

  async function onResendOtp() {
    if (!phone || resendCooldown > 0) return;
    setPending(true);
    setError('');
    attemptedOtpRef.current = '';
    try {
      await sendLinkPhoneOtp(phone);
      setOtp('');
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (err) {
      setError(mapLinkError(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{step === 'phone' ? 'Add phone number' : 'Verify phone'}</DialogTitle>
          <DialogDescription>
            {step === 'phone'
              ? 'We will send a one-time code to link this number to your account.'
              : `Enter the code sent to +91 ${phone}.`}
          </DialogDescription>
        </DialogHeader>

        <View className="gap-4">
          {step === 'phone' ? (
            <>
              <IndiaPhoneField
                label="Phone number"
                nativeID="linkPhone"
                control={control}
                name="phone"
                error={formState.errors.phone?.message}
              />
              <Button
                disabled={!formState.isValid || pending}
                onPress={handleSubmit(onSendOtp)}>
                <Text>{pending ? 'Sending…' : 'Send OTP'}</Text>
              </Button>
            </>
          ) : (
            <>
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
              <Button disabled={pending || otp.length < 6} onPress={() => void submitOtp(otp)}>
                <Text>{pending ? 'Linking…' : 'Confirm'}</Text>
              </Button>
              <Button
                variant="ghost"
                disabled={pending || resendCooldown > 0}
                onPress={() => void onResendOtp()}>
                <Text>
                  {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : 'Resend OTP'}
                </Text>
              </Button>
            </>
          )}
          {error ? <Text className="text-destructive text-sm">{error}</Text> : null}
        </View>
      </DialogContent>
    </Dialog>
  );
}
