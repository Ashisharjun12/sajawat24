export type CustomerUser = {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  avatar?: string | null;
  linkedGoogle?: boolean;
};

export type PublicUser = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  avatar?: string | null;
  role?: string;
  linkedGoogle?: boolean;
};

export type AuthSessionPayload = {
  accessToken: string;
  refreshToken?: string;
  user: CustomerUser;
};

/** @deprecated Use AuthSessionPayload — kept for mock OTP slice */
export type MockSessionPayload = AuthSessionPayload;

export function mapPublicUserToCustomer(user: PublicUser): CustomerUser {
  return {
    id: user.id,
    name: user.name,
    phone: user.phone ?? '',
    email: user.email,
    avatar: user.avatar,
    linkedGoogle: user.linkedGoogle,
  };
}

export type MobileAuthResponse = {
  accessToken: string;
  refreshToken?: string;
  user: PublicUser;
};

/** @deprecated Use MobileAuthResponse */
export type GoogleAuthResponse = MobileAuthResponse;

export type OtpRequestResult = {
  phone: string;
  otp?: string;
};
