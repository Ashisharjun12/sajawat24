/** Env keys for MSG91 One API Flow IDs (WhatsApp). */
export const MSG91_FLOW_ENV_KEYS = [
    "MSG91_FLOW_LOGIN_OTP",
    "MSG91_FLOW_BOOKING_CONFIRMED",
    "MSG91_FLOW_BOOKING_ASSIGNED",
    "MSG91_FLOW_VENDOR_EN_ROUTE",
    "MSG91_FLOW_VENDOR_ON_SITE",
    "MSG91_FLOW_DELIVERY_CODE",
    "MSG91_FLOW_BOOKING_COMPLETED",
    "MSG91_FLOW_VENDOR_NEW_JOB",
    "MSG91_FLOW_VENDOR_JOB_ASSIGNED",
    "MSG91_FLOW_BOOKING_REMINDER",
    "MSG91_FLOW_PAYOUT_PAID",
    "MSG91_FLOW_PAYOUT_FAILED",
] as const;

/** Env keys for MSG91 DLT SMS template IDs. */
export const MSG91_TEMPLATE_ENV_KEYS = [
    "MSG91_TEMPLATE_LOGIN_OTP",
    "MSG91_TEMPLATE_LOGIN_OTP_ANDROID",
    "MSG91_TEMPLATE_BOOKING_CONFIRMED",
    "MSG91_TEMPLATE_BOOKING_ASSIGNED",
    "MSG91_TEMPLATE_VENDOR_EN_ROUTE",
    "MSG91_TEMPLATE_VENDOR_ON_SITE",
    "MSG91_TEMPLATE_DELIVERY_CODE",
    "MSG91_TEMPLATE_BOOKING_COMPLETED",
    "MSG91_TEMPLATE_VENDOR_NEW_JOB",
    "MSG91_TEMPLATE_VENDOR_JOB_ASSIGNED",
    "MSG91_TEMPLATE_BOOKING_REMINDER",
    "MSG91_TEMPLATE_PAYOUT_PAID",
    "MSG91_TEMPLATE_PAYOUT_FAILED",
] as const;

export type Msg91FlowEnvKey = (typeof MSG91_FLOW_ENV_KEYS)[number];
export type Msg91TemplateEnvKey = (typeof MSG91_TEMPLATE_ENV_KEYS)[number];

export type Msg91EnvConfig = {
    flowApiUrl: string;
    flows: Record<Msg91FlowEnvKey, string | undefined>;
    templates: Record<Msg91TemplateEnvKey, string | undefined>;
};

const DEFAULT_FLOW_API_URL = "https://api.msg91.com/api/v5/flow/";

function pickTrimmed(env: NodeJS.ProcessEnv, key: string): string | undefined {
    const value = env[key]?.trim();
    return value ? value : undefined;
}

export function loadMsg91EnvConfig(env: NodeJS.ProcessEnv = process.env): Msg91EnvConfig {
    const flows = {} as Record<Msg91FlowEnvKey, string | undefined>;
    for (const key of MSG91_FLOW_ENV_KEYS) {
        flows[key] = pickTrimmed(env, key);
    }

    const templates = {} as Record<Msg91TemplateEnvKey, string | undefined>;
    for (const key of MSG91_TEMPLATE_ENV_KEYS) {
        templates[key] = pickTrimmed(env, key);
    }

    return {
        flowApiUrl: pickTrimmed(env, "MSG91_FLOW_API_URL") ?? DEFAULT_FLOW_API_URL,
        flows,
        templates,
    };
}
