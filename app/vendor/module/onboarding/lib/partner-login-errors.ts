import type { PartnerLoginIntent } from '@/lib/login-intent';
import axios from 'axios';
import {
  OWNER_LOGIN_ERROR,
  STAFF_LOGIN_ERROR,
} from '@/lib/login-intent';

export type PartnerLoginErrorCode =
  | 'USE_STAFF_LOGIN'
  | 'USE_OWNER_LOGIN'
  | 'PARTNER_LOGIN_NOT_FOUND'
  | 'LOGIN_INTENT_REQUIRED'
  | 'SHOP_NOT_ACTIVE';

export type MappedPartnerLoginError = {
  message: string;
  code?: PartnerLoginErrorCode;
  suggestIntent?: PartnerLoginIntent;
};

/** API code means “sign in using this path”, not “you are already on this path”. */
function intentForCode(code: PartnerLoginErrorCode): PartnerLoginIntent | undefined {
  if (code === 'USE_STAFF_LOGIN') return 'staff';
  if (code === 'USE_OWNER_LOGIN') return 'owner';
  return undefined;
}

function messageForWrongPath(
  target: PartnerLoginIntent,
  currentIntent: PartnerLoginIntent | null,
): string {
  if (target === 'owner') {
    return currentIntent === 'staff'
      ? 'This is a vendor partner (shop owner) number. Use vendor partner login instead.'
      : OWNER_LOGIN_ERROR;
  }
  return currentIntent === 'owner'
    ? 'This number is for staff. Use staff login instead.'
    : STAFF_LOGIN_ERROR;
}

export function mapPartnerLoginFailure(
  input: { message?: string; code?: string },
  currentIntent: PartnerLoginIntent | null,
): MappedPartnerLoginError {
  const code = input.code as PartnerLoginErrorCode | undefined;
  const message = (input.message ?? '').toLowerCase();

  const switchTarget = code ? intentForCode(code) : undefined;
  if (switchTarget) {
    const suggestIntent =
      switchTarget !== currentIntent ? switchTarget : undefined;
    return {
      code,
      suggestIntent,
      message: messageForWrongPath(switchTarget, currentIntent),
    };
  }

  if (code === 'PARTNER_LOGIN_NOT_FOUND') {
    return {
      code,
      message:
        currentIntent === 'staff' ? STAFF_LOGIN_ERROR : OWNER_LOGIN_ERROR,
    };
  }

  if (code === 'LOGIN_INTENT_REQUIRED') {
    return {
      code,
      message: 'Choose vendor partner or staff login and try again.',
    };
  }

  if (code === 'SHOP_NOT_ACTIVE') {
    return {
      code,
      message: 'This shop is not active. Contact your shop owner or Decoryy support.',
    };
  }

  if (message.includes('use staff login') || message.includes('vendor partner login for this')) {
    const target: PartnerLoginIntent =
      message.includes('vendor partner') ? 'owner' : 'staff';
    return {
      code: target === 'staff' ? 'USE_STAFF_LOGIN' : 'USE_OWNER_LOGIN',
      suggestIntent: target !== currentIntent ? target : undefined,
      message: messageForWrongPath(target, currentIntent),
    };
  }

  if (message.includes('no staff account')) {
    const target: PartnerLoginIntent =
      currentIntent === 'staff' ? 'owner' : 'staff';
    return {
      code: target === 'owner' ? 'USE_OWNER_LOGIN' : 'PARTNER_LOGIN_NOT_FOUND',
      suggestIntent: target !== currentIntent ? target : undefined,
      message:
        currentIntent === 'staff'
          ? 'This number is not on a staff account. If this is your shop phone, use vendor partner login.'
          : STAFF_LOGIN_ERROR,
    };
  }

  if (message.includes('no vendor partner account') || message.includes('register your shop')) {
    return {
      code: 'USE_OWNER_LOGIN',
      suggestIntent: currentIntent === 'owner' ? undefined : 'owner',
      message: OWNER_LOGIN_ERROR,
    };
  }

  if (message.includes('shop is not active')) {
    return {
      code: 'SHOP_NOT_ACTIVE',
      message: 'This shop is not active. Contact your shop owner or Decoryy support.',
    };
  }

  return { message: input.message ?? 'Something went wrong' };
}

export function partnerLoginErrorFromUnknown(
  err: unknown,
  currentIntent: PartnerLoginIntent | null,
): MappedPartnerLoginError {
  if (axios.isAxiosError(err) && err.response?.data && typeof err.response.data === 'object') {
    const data = err.response.data as { message?: string; code?: string };
    return mapPartnerLoginFailure(data, currentIntent);
  }
  return mapPartnerLoginFailure(
    { message: err instanceof Error ? err.message : undefined },
    currentIntent,
  );
}
