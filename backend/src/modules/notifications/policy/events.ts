import type {
    NotificationChannel,
    NotificationPriority,
    NotificationTemplateType,
} from "@/modules/notifications/schema.js";

export const NOTIFICATION_EVENTS = [
    "LOGIN_OTP",
    "BOOKING_CONFIRMED",
    "BOOKING_ASSIGNED",
    "VENDOR_EN_ROUTE",
    "VENDOR_ON_SITE",
    "DELIVERY_CODE",
    "BOOKING_COMPLETED",
    "VENDOR_NEW_JOB",
    "VENDOR_JOB_ASSIGNED",
    "BOOKING_REMINDER",
    "CHAT_MESSAGE",
    "PAYOUT_PAID",
    "PAYOUT_FAILED",
    "DISPATCH_EXHAUSTED",
] as const;
export type NotificationEvent = (typeof NOTIFICATION_EVENTS)[number];

export type EventChannelPolicy = {
    templateKey: string;
    channel: NotificationChannel;
    type: NotificationTemplateType;
    priority: NotificationPriority;
    required: boolean;
};

export type EventPolicy = {
    channels: EventChannelPolicy[];
};

function pushAndInAppChannels(
    templateKey: string,
    type: NotificationTemplateType,
    priority: NotificationPriority,
): EventChannelPolicy[] {
    return [
        {
            templateKey,
            channel: "push",
            type,
            priority,
            required: false,
        },
        {
            templateKey,
            channel: "in_app",
            type,
            priority,
            required: false,
        },
    ];
}

function phoneChannels(
    templateKey: string,
    type: NotificationTemplateType,
    priority: NotificationPriority,
): EventChannelPolicy[] {
    return [
        {
            templateKey,
            channel: "sms",
            type,
            priority,
            required: false,
        },
        {
            templateKey,
            channel: "whatsapp",
            type,
            priority,
            required: false,
        },
    ];
}

export const EVENT_POLICIES: Record<NotificationEvent, EventPolicy> = {
    LOGIN_OTP: {
        channels: phoneChannels("login_otp", "transactional", "critical"),
    },
    BOOKING_CONFIRMED: {
        channels: [
            {
                templateKey: "booking_confirmed",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("booking_confirmed", "transactional", "standard"),
            ...pushAndInAppChannels("booking_confirmed", "transactional", "standard"),
        ],
    },
    BOOKING_ASSIGNED: {
        channels: [
            {
                templateKey: "booking_assigned",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("booking_assigned", "transactional", "standard"),
            ...pushAndInAppChannels("booking_assigned", "transactional", "standard"),
        ],
    },
    VENDOR_EN_ROUTE: {
        channels: [
            {
                templateKey: "vendor_en_route",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("vendor_en_route", "transactional", "standard"),
            ...pushAndInAppChannels("vendor_en_route", "transactional", "standard"),
        ],
    },
    VENDOR_ON_SITE: {
        channels: [
            {
                templateKey: "vendor_on_site",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("vendor_on_site", "transactional", "standard"),
            ...pushAndInAppChannels("vendor_on_site", "transactional", "standard"),
        ],
    },
    DELIVERY_CODE: {
        // OTP-style secret: SMS / WhatsApp / email only (vendor sends; customer does not confirm in app).
        channels: [
            {
                templateKey: "delivery_code",
                channel: "email",
                type: "transactional",
                priority: "critical",
                required: false,
            },
            ...phoneChannels("delivery_code", "transactional", "critical"),
        ],
    },
    BOOKING_COMPLETED: {
        channels: [
            {
                templateKey: "booking_completed",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("booking_completed", "transactional", "standard"),
            ...pushAndInAppChannels("booking_completed", "transactional", "standard"),
        ],
    },
    VENDOR_NEW_JOB: {
        channels: [
            {
                templateKey: "vendor_new_job",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "vendor_new_job",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("vendor_new_job", "transactional", "standard"),
        ],
    },
    VENDOR_JOB_ASSIGNED: {
        channels: [
            {
                templateKey: "vendor_job_assigned",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "vendor_job_assigned",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("vendor_job_assigned", "transactional", "standard"),
        ],
    },
    BOOKING_REMINDER: {
        channels: [
            ...phoneChannels("booking_reminder", "transactional", "standard"),
            {
                templateKey: "booking_reminder",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "booking_reminder",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
        ],
    },
    CHAT_MESSAGE: {
        channels: [
            {
                templateKey: "chat_message",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "chat_message",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
        ],
    },
    PAYOUT_PAID: {
        channels: [
            {
                templateKey: "payout_paid",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("payout_paid", "transactional", "standard"),
            {
                templateKey: "payout_paid",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "payout_paid",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
        ],
    },
    DISPATCH_EXHAUSTED: {
        channels: [
            {
                templateKey: "dispatch_exhausted",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
        ],
    },
    PAYOUT_FAILED: {
        channels: [
            {
                templateKey: "payout_failed",
                channel: "email",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            ...phoneChannels("payout_failed", "transactional", "standard"),
            {
                templateKey: "payout_failed",
                channel: "push",
                type: "transactional",
                priority: "standard",
                required: false,
            },
            {
                templateKey: "payout_failed",
                channel: "in_app",
                type: "transactional",
                priority: "standard",
                required: false,
            },
        ],
    },
};

export function isNotificationEvent(value: string): value is NotificationEvent {
    return (NOTIFICATION_EVENTS as readonly string[]).includes(value);
}
