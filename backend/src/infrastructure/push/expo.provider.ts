import Expo from "expo-server-sdk";
import type { PushMessage, PushPort } from "@/infrastructure/push/push.port.js";

export type ExpoPushSendResult = {
    ok: boolean;
    staleToken?: boolean;
    error?: string;
};

export class ExpoPushProvider implements PushPort {
    private readonly expo = new Expo();

    async send(message: PushMessage): Promise<void> {
        const result = await this.sendOne(message);
        if (!result.ok) {
            throw new Error(result.error ?? "expo push failed");
        }
    }

    async sendOne(message: PushMessage): Promise<ExpoPushSendResult> {
        if (!Expo.isExpoPushToken(message.to)) {
            return { ok: false, error: "invalid expo push token" };
        }

        const tickets = await this.expo.sendPushNotificationsAsync([
            {
                to: message.to,
                title: message.title,
                body: message.body,
                data: message.data,
                sound: "default",
                priority: message.priority ?? "default",
                ...(message.androidChannelId
                    ? { channelId: message.androidChannelId }
                    : {}),
            },
        ]);

        const ticket = tickets[0];
        if (!ticket) {
            return { ok: false, error: "no push ticket returned" };
        }

        if (ticket.status === "ok") {
            return { ok: true };
        }

        const details = ticket.details;
        const stale =
            details &&
            typeof details === "object" &&
            "error" in details &&
            details.error === "DeviceNotRegistered";

        const errorMessage =
            ticket.message ??
            (details && typeof details === "object" && "error" in details
                ? String(details.error)
                : "expo push error");

        return {
            ok: false,
            staleToken: stale || errorMessage.includes("DeviceNotRegistered"),
            error: errorMessage,
        };
    }
}
