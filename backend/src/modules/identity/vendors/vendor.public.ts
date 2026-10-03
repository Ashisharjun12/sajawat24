import type { VendorOnboardingStatus } from "@/modules/identity/vendors/vendor.schema.js";

export type PublicVendorProfile = {
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

export type AdminVendorListItem = {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
    cityName: string;
    state: string;
    onboardingStatus: VendorOnboardingStatus;
    isOnDuty: boolean;
    dutyChangedAt: Date | null;
    createdAt: Date;
};

export type AdminVendorDetail = AdminVendorListItem & {
    altPhone: string | null;
    shopAddress: string;
    pincode: string;
    shopImageUrl: string | null;
    userId: string;
};
