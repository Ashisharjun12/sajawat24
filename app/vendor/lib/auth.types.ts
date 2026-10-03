export type VendorOnboardingStatus = 'PENDING' | 'ACTIVE' | 'REJECTED' | 'BLOCKED';

export type VendorProfile = {
  id: string;
  cityId: string;
  cityName: string;
  state: string;
  shopAddress: string;
  pincode: string;
  altPhone: string | null;
  shopImageUrl: string | null;
  onboardingStatus: VendorOnboardingStatus;
  isOnDuty: boolean;
  dutyChangedAt: string | null;
};

export type PartnerMembership = {
  vendorId: string;
  memberId: string;
  kind: 'OWNER' | 'WORKER';
  shopName?: string;
};

export type PartnerCapabilities = {
  isShopOwner: boolean;
  isFieldWorker: boolean;
  canSwitchToFieldMode: boolean;
};

export type AuthUser = {
  id: string;
  phone: string | null;
  email: string | null;
  name: string;
  avatar: string | null;
  role: string;
  status: string;
  linkedGoogle: boolean;
  vendor?: VendorProfile;
  partnerMembership?: PartnerMembership;
  capabilities: PartnerCapabilities;
};

export type AuthSessionPayload = {
  accessToken: string;
  refreshToken?: string;
  user: AuthUser;
};
