export const NOTIFICATION_CHANNELS = ["sms", "email", "push", "inApp", "whatsapp"] as const;

export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export type NotificationChannelFlags = Record<NotificationChannel, boolean>;

export const NOTIFY_CHANNELS_KEY = "notify.channels";

export const DEFAULT_NOTIFICATION_CHANNELS: NotificationChannelFlags = {
    sms: true,
    email: true,
    push: true,
    inApp: true,
    whatsapp: false,
};

export function mergeNotificationChannels(value: unknown): NotificationChannelFlags {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};
    return {
        sms: typeof raw.sms === "boolean" ? raw.sms : DEFAULT_NOTIFICATION_CHANNELS.sms,
        email: typeof raw.email === "boolean" ? raw.email : DEFAULT_NOTIFICATION_CHANNELS.email,
        push: typeof raw.push === "boolean" ? raw.push : DEFAULT_NOTIFICATION_CHANNELS.push,
        inApp: typeof raw.inApp === "boolean" ? raw.inApp : DEFAULT_NOTIFICATION_CHANNELS.inApp,
        whatsapp:
            typeof raw.whatsapp === "boolean"
                ? raw.whatsapp
                : DEFAULT_NOTIFICATION_CHANNELS.whatsapp,
    };
}
