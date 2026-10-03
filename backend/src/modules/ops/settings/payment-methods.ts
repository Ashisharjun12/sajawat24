export const PAYMENT_METHODS = ["razorpay", "cashfree", "cod"] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type PaymentMethodFlags = Record<PaymentMethod, boolean>;

export type OnlinePaymentProvider = "razorpay" | "cashfree";

export type PublicPaymentMethods = PaymentMethodFlags & {
    online: boolean;
    provider: OnlinePaymentProvider | null;
};

export function activeOnlineProvider(flags: PaymentMethodFlags): OnlinePaymentProvider | null {
    if (flags.razorpay) return "razorpay";
    if (flags.cashfree) return "cashfree";
    return null;
}

export const PAY_METHODS_KEY = "pay.methods";

export const DEFAULT_PAYMENT_METHODS: PaymentMethodFlags = {
    razorpay: false,
    cashfree: false,
    cod: true,
};

export function mergePaymentMethods(value: unknown): PaymentMethodFlags {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
    return {
        razorpay:
            typeof raw.razorpay === "boolean" ? raw.razorpay : DEFAULT_PAYMENT_METHODS.razorpay,
        cashfree:
            typeof raw.cashfree === "boolean" ? raw.cashfree : DEFAULT_PAYMENT_METHODS.cashfree,
        cod: typeof raw.cod === "boolean" ? raw.cod : DEFAULT_PAYMENT_METHODS.cod,
    };
}

export function toPublicPaymentMethods(flags: PaymentMethodFlags): PublicPaymentMethods {
    return {
        ...flags,
        online: flags.razorpay || flags.cashfree,
        provider: activeOnlineProvider(flags),
    };
}

export function exclusiveOnlineProviders(
    flags: PaymentMethodFlags,
    input: Partial<PaymentMethodFlags> = {},
): PaymentMethodFlags {
    const next = { ...flags };
    if (input.razorpay === true) {
        next.cashfree = false;
    } else if (input.cashfree === true) {
        next.razorpay = false;
    } else if (next.razorpay && next.cashfree) {
        next.cashfree = false;
    }
    return next;
}
