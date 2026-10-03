import type { NotificationEvent } from "@/modules/notifications/policy/events.js";
import type { Msg91FlowEnvKey, Msg91TemplateEnvKey } from "@/config/msg91.config.js";

export type Msg91EventRoute = {
    flowEnvKey: Msg91FlowEnvKey;
    templateEnvKey: Msg91TemplateEnvKey;
    /** Ordered keys for Flow VAR1… / SMS var1… */
    variableKeys: string[];
};

/**
 * Single map: notification event → MSG91 env keys + variable order.
 * Admin catalog (message-service-catalog.ts) should stay aligned with these keys.
 */
export const MSG91_EVENT_ROUTES: Partial<Record<NotificationEvent, Msg91EventRoute>> = {
    LOGIN_OTP: {
        flowEnvKey: "MSG91_FLOW_LOGIN_OTP",
        templateEnvKey: "MSG91_TEMPLATE_LOGIN_OTP",
        variableKeys: ["otp"],
    },
    BOOKING_CONFIRMED: {
        flowEnvKey: "MSG91_FLOW_BOOKING_CONFIRMED",
        templateEnvKey: "MSG91_TEMPLATE_BOOKING_CONFIRMED",
        variableKeys: ["customerName", "orderRef", "scheduledAt", "trackUrl"],
    },
    BOOKING_ASSIGNED: {
        flowEnvKey: "MSG91_FLOW_BOOKING_ASSIGNED",
        templateEnvKey: "MSG91_TEMPLATE_BOOKING_ASSIGNED",
        variableKeys: ["vendorName", "orderRef", "scheduledAt", "trackUrl"],
    },
    VENDOR_EN_ROUTE: {
        flowEnvKey: "MSG91_FLOW_VENDOR_EN_ROUTE",
        templateEnvKey: "MSG91_TEMPLATE_VENDOR_EN_ROUTE",
        variableKeys: ["vendorName", "orderRef", "trackUrl"],
    },
    VENDOR_ON_SITE: {
        flowEnvKey: "MSG91_FLOW_VENDOR_ON_SITE",
        templateEnvKey: "MSG91_TEMPLATE_VENDOR_ON_SITE",
        variableKeys: ["vendorName", "orderRef"],
    },
    DELIVERY_CODE: {
        flowEnvKey: "MSG91_FLOW_DELIVERY_CODE",
        templateEnvKey: "MSG91_TEMPLATE_DELIVERY_CODE",
        variableKeys: ["orderRef", "code"],
    },
    BOOKING_COMPLETED: {
        flowEnvKey: "MSG91_FLOW_BOOKING_COMPLETED",
        templateEnvKey: "MSG91_TEMPLATE_BOOKING_COMPLETED",
        variableKeys: ["orderRef"],
    },
    VENDOR_NEW_JOB: {
        flowEnvKey: "MSG91_FLOW_VENDOR_NEW_JOB",
        templateEnvKey: "MSG91_TEMPLATE_VENDOR_NEW_JOB",
        variableKeys: ["orderRef", "scheduledAt", "address"],
    },
    VENDOR_JOB_ASSIGNED: {
        flowEnvKey: "MSG91_FLOW_VENDOR_JOB_ASSIGNED",
        templateEnvKey: "MSG91_TEMPLATE_VENDOR_JOB_ASSIGNED",
        variableKeys: ["orderRef", "scheduledAt", "address"],
    },
    BOOKING_REMINDER: {
        flowEnvKey: "MSG91_FLOW_BOOKING_REMINDER",
        templateEnvKey: "MSG91_TEMPLATE_BOOKING_REMINDER",
        variableKeys: ["orderRef", "scheduledAt", "trackUrl"],
    },
    PAYOUT_PAID: {
        flowEnvKey: "MSG91_FLOW_PAYOUT_PAID",
        templateEnvKey: "MSG91_TEMPLATE_PAYOUT_PAID",
        variableKeys: ["amountFormatted", "payoutDestination"],
    },
    PAYOUT_FAILED: {
        flowEnvKey: "MSG91_FLOW_PAYOUT_FAILED",
        templateEnvKey: "MSG91_TEMPLATE_PAYOUT_FAILED",
        variableKeys: ["amountFormatted", "failureReason"],
    },
};
