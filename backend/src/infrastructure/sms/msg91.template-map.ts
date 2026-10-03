import { _config } from "@/config/config.js";
import type { NotificationEvent } from "@/modules/notifications/policy/events.js";
import { MSG91_EVENT_ROUTES } from "@/infrastructure/sms/msg91.event-routes.js";

export type Msg91TemplateRoute = {
    templateId: string;
    /** Ordered keys read from eventData for MSG91 var1, var2, … */
    variableKeys: string[];
};

/**
 * Resolve DLT template + variable order for a notification event.
 * Returns null if no MSG91 template ID is configured for this event.
 */
export function resolveMsg91Template(
    event: string | undefined,
    eventData: Record<string, string> | undefined,
): Msg91TemplateRoute | null {
    if (!event) return null;
    const data = eventData ?? {};

    if (event === "LOGIN_OTP") {
        const hash = data.androidAppHash?.trim();
        const androidId = _config.MSG91.templates.MSG91_TEMPLATE_LOGIN_OTP_ANDROID;
        if (hash && androidId) {
            return { templateId: androidId, variableKeys: ["otp", "androidAppHash"] };
        }
        const standardId = _config.MSG91.templates.MSG91_TEMPLATE_LOGIN_OTP;
        if (!standardId) return null;
        return { templateId: standardId, variableKeys: ["otp"] };
    }

    const spec = MSG91_EVENT_ROUTES[event as NotificationEvent];
    if (!spec) return null;

    const templateId = _config.MSG91.templates[spec.templateEnvKey];
    if (!templateId) return null;

    return { templateId, variableKeys: spec.variableKeys };
}

export function msg91MobileFromE164(to: string): string {
    const digits = to.replace(/\D/g, "");
    if (digits.length === 12 && digits.startsWith("91")) {
        return digits;
    }
    if (digits.length === 10) {
        return `91${digits}`;
    }
    if (digits.startsWith("91") && digits.length >= 12) {
        return digits.slice(0, 12);
    }
    throw new Error(`MSG91: unsupported phone format: ${to}`);
}

export function buildMsg91RecipientVars(
    variableKeys: string[],
    eventData: Record<string, string>,
): Record<string, string> {
    const recipient: Record<string, string> = {};
    variableKeys.forEach((key, index) => {
        const varKey = `var${index + 1}`;
        let value = eventData[key] ?? "";
        if (key === "androidAppHash") {
            value = eventData.androidAppHash ?? "";
        }
        recipient[varKey] = value;
    });
    return recipient;
}

export function assertMsg91Configured(): void {
    if (!_config.MSG91_AUTH_KEY?.trim()) {
        throw new Error("MSG91_AUTH_KEY is required when SMS_PROVIDER=msg91");
    }
    if (!_config.MSG91_SENDER_ID?.trim()) {
        throw new Error("MSG91_SENDER_ID is required when SMS_PROVIDER=msg91");
    }
}
