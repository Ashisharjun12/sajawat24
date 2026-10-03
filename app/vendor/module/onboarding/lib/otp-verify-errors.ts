import axios from 'axios';

export type OtpVerifyErrorCode =
  | 'OTP_EXPIRED'
  | 'OTP_INVALID'
  | 'OTP_ATTEMPTS_EXHAUSTED';

export type MappedOtpVerifyError = {
  isOtpError: true;
  message: string;
  suggestResend: boolean;
  code?: OtpVerifyErrorCode;
};

const RESEND_HINT = "Tap “Didn't receive a code?” below to get a new one.";

function mapByCode(code: OtpVerifyErrorCode): MappedOtpVerifyError {
  switch (code) {
    case 'OTP_EXPIRED':
      return {
        isOtpError: true,
        code,
        suggestResend: true,
        message: `This code has expired. ${RESEND_HINT}`,
      };
    case 'OTP_INVALID':
      return {
        isOtpError: true,
        code,
        suggestResend: false,
        message: 'Incorrect code. Check the SMS and try again.',
      };
    case 'OTP_ATTEMPTS_EXHAUSTED':
      return {
        isOtpError: true,
        code,
        suggestResend: true,
        message: `Too many wrong attempts. ${RESEND_HINT}`,
      };
  }
}

function mapByMessage(message: string): MappedOtpVerifyError | null {
  const lower = message.toLowerCase();
  if (lower.includes('otp expired') || lower.includes('not requested')) {
    return mapByCode('OTP_EXPIRED');
  }
  if (lower.includes('too many invalid otp')) {
    return mapByCode('OTP_ATTEMPTS_EXHAUSTED');
  }
  if (lower.includes('invalid otp')) {
    return mapByCode('OTP_INVALID');
  }
  return null;
}

export function mapOtpVerifyError(err: unknown): MappedOtpVerifyError | null {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data as { message?: string; code?: string };
    const code = data.code as OtpVerifyErrorCode | undefined;
    if (code === 'OTP_EXPIRED' || code === 'OTP_INVALID' || code === 'OTP_ATTEMPTS_EXHAUSTED') {
      return mapByCode(code);
    }
    if (data.message) {
      return mapByMessage(data.message);
    }
  }
  if (err instanceof Error) {
    return mapByMessage(err.message);
  }
  return null;
}
