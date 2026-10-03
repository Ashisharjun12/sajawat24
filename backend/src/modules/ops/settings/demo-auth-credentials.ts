import { normalizePhone } from "@/modules/identity/auth/phone.js";

export type DemoAuthCredentials = {
    customerPhone: string;
    vendorOwnerPhone: string;
    vendorStaffPhone: string;
    otp: string;
};

const DEFAULT_CUSTOMER_PHONE = "9000000001";
const DEFAULT_VENDOR_OWNER_PHONE = "9000000002";
const DEFAULT_VENDOR_STAFF_PHONE = "9000000003";
const DEFAULT_OTP = "123456";

function readPhone(envValue: string | undefined, fallback: string): string {
    const raw = envValue?.trim() || fallback;
    return normalizePhone(raw);
}

export function getDemoAuthCredentials(): DemoAuthCredentials {
    return {
        customerPhone: readPhone(process.env.DEMO_CUSTOMER_PHONE, DEFAULT_CUSTOMER_PHONE),
        vendorOwnerPhone: readPhone(process.env.DEMO_VENDOR_OWNER_PHONE, DEFAULT_VENDOR_OWNER_PHONE),
        vendorStaffPhone: readPhone(process.env.DEMO_VENDOR_STAFF_PHONE, DEFAULT_VENDOR_STAFF_PHONE),
        otp: process.env.DEMO_AUTH_OTP?.trim() || DEFAULT_OTP,
    };
}

export function maskDemoOtp(_otp: string): string {
    return "******";
}
