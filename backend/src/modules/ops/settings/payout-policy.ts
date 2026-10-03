export const PAYOUT_POLICY_KEY = "pay.payout_policy";

export type PayoutPolicy = {
    platformCommissionPercent: number;
    codMaxDuePaise: number;
    settlementHoldDays: number;
    autoNetCodFromEarnings: boolean;
    minWithdrawalPaise: number;
};

export const DEFAULT_PAYOUT_POLICY: PayoutPolicy = {
    platformCommissionPercent: 10,
    codMaxDuePaise: 500_000,
    settlementHoldDays: 0,
    autoNetCodFromEarnings: true,
    minWithdrawalPaise: 10_000,
};

export function mergePayoutPolicy(value: unknown): PayoutPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const platformCommissionPercent =
        typeof raw.platformCommissionPercent === "number"
            ? Math.min(50, Math.max(0, Math.round(raw.platformCommissionPercent)))
            : DEFAULT_PAYOUT_POLICY.platformCommissionPercent;

    const codMaxDuePaise =
        typeof raw.codMaxDuePaise === "number" && raw.codMaxDuePaise >= 0
            ? Math.round(raw.codMaxDuePaise)
            : DEFAULT_PAYOUT_POLICY.codMaxDuePaise;

    const settlementHoldDays =
        typeof raw.settlementHoldDays === "number" && raw.settlementHoldDays >= 0
            ? Math.min(30, Math.round(raw.settlementHoldDays))
            : DEFAULT_PAYOUT_POLICY.settlementHoldDays;

    const autoNetCodFromEarnings =
        typeof raw.autoNetCodFromEarnings === "boolean"
            ? raw.autoNetCodFromEarnings
            : DEFAULT_PAYOUT_POLICY.autoNetCodFromEarnings;

    const minWithdrawalPaise =
        typeof raw.minWithdrawalPaise === "number" && raw.minWithdrawalPaise >= 0
            ? Math.round(raw.minWithdrawalPaise)
            : DEFAULT_PAYOUT_POLICY.minWithdrawalPaise;

    return {
        platformCommissionPercent,
        codMaxDuePaise,
        settlementHoldDays,
        autoNetCodFromEarnings,
        minWithdrawalPaise,
    };
}
