import type { PartnerLoginIntent } from "@/modules/identity/auth/partner-login-eligibility.js";
import {
    getDemoAuthCredentials,
    type DemoAuthCredentials,
} from "@/modules/ops/settings/demo-auth-credentials.js";

export const DEMO_AUTH_KEY = "demo.auth";

export type DemoAuthPolicy = {
    enabled: boolean;
    customerApp: boolean;
    vendorOwnerApp: boolean;
    vendorStaffApp: boolean;
};

export const DEFAULT_DEMO_AUTH_POLICY: DemoAuthPolicy = {
    enabled: false,
    customerApp: false,
    vendorOwnerApp: false,
    vendorStaffApp: false,
};

export type DemoAuthAdminView = DemoAuthPolicy & {
    credentials: {
        customerPhone: string;
        vendorOwnerPhone: string;
        vendorStaffPhone: string;
        otpMasked: string;
    };
};

export type PatchDemoAuthPolicyInput = Partial<DemoAuthPolicy>;

function readBool(raw: unknown, fallback: boolean): boolean {
    return typeof raw === "boolean" ? raw : fallback;
}

function legacySlotEnabled(raw: unknown): boolean | undefined {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
    const enabled = (raw as Record<string, unknown>).enabled;
    return typeof enabled === "boolean" ? enabled : undefined;
}

export function mergeDemoAuthPolicy(value: unknown): DemoAuthPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const legacyCustomer = legacySlotEnabled(raw.customerApp ?? raw.customer_app);
    const legacyVendor = legacySlotEnabled(raw.vendorApp ?? raw.vendor_app);

    const customerApp =
        typeof raw.customerApp === "boolean"
            ? raw.customerApp
            : (legacyCustomer ?? DEFAULT_DEMO_AUTH_POLICY.customerApp);
    const vendorOwnerApp =
        typeof raw.vendorOwnerApp === "boolean"
            ? raw.vendorOwnerApp
            : (legacyVendor ?? DEFAULT_DEMO_AUTH_POLICY.vendorOwnerApp);

    return {
        enabled: readBool(raw.enabled, DEFAULT_DEMO_AUTH_POLICY.enabled),
        customerApp,
        vendorOwnerApp,
        vendorStaffApp: readBool(raw.vendorStaffApp, DEFAULT_DEMO_AUTH_POLICY.vendorStaffApp),
    };
}

export function applyDemoAuthPatch(
    current: DemoAuthPolicy,
    input: PatchDemoAuthPolicyInput,
): DemoAuthPolicy {
    const next: DemoAuthPolicy = { ...current, ...input };
    if (!next.enabled) {
        return {
            ...next,
            customerApp: false,
            vendorOwnerApp: false,
            vendorStaffApp: false,
        };
    }
    return next;
}

export function toDemoAuthAdminView(policy: DemoAuthPolicy): DemoAuthAdminView {
    const credentials = getDemoAuthCredentials();
    return {
        ...policy,
        credentials: {
            customerPhone: credentials.customerPhone,
            vendorOwnerPhone: credentials.vendorOwnerPhone,
            vendorStaffPhone: credentials.vendorStaffPhone,
            otpMasked: "******",
        },
    };
}

export function resolveDemoOtp(
    phone: string,
    loginIntent: PartnerLoginIntent | undefined,
    policy: DemoAuthPolicy,
    credentials: DemoAuthCredentials = getDemoAuthCredentials(),
): string | null {
    if (!policy.enabled) {
        return null;
    }
    if (!loginIntent) {
        if (policy.customerApp && phone === credentials.customerPhone) {
            return credentials.otp;
        }
        return null;
    }
    if (loginIntent === "owner") {
        if (policy.vendorOwnerApp && phone === credentials.vendorOwnerPhone) {
            return credentials.otp;
        }
        return null;
    }
    if (loginIntent === "staff") {
        if (policy.vendorStaffApp && phone === credentials.vendorStaffPhone) {
            return credentials.otp;
        }
        return null;
    }
    return null;
}

export function isDemoLoginRequest(
    phone: string,
    loginIntent: PartnerLoginIntent | undefined,
    policy: DemoAuthPolicy,
): boolean {
    return resolveDemoOtp(phone, loginIntent, policy) !== null;
}
