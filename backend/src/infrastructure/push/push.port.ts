export type PushPriority = "default" | "normal" | "high";

export type PushMessage = {
    to: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    /** Android notification channel; must match app/vendor/lib/notifications.ts */
    androidChannelId?: string;
    priority?: PushPriority;
};

export interface PushPort {
    send(message: PushMessage): Promise<void>;
}
