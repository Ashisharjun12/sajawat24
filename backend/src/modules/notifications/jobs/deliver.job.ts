import type { Job } from "bullmq";
import { EmailFactory } from "@/infrastructure/email/email.factory.js";
import { PushFactory } from "@/infrastructure/push/push.factory.js";
import { ExpoPushProvider } from "@/infrastructure/push/expo.provider.js";
import { SmsFactory } from "@/infrastructure/sms/sms.factory.js";
import { WhatsAppFactory } from "@/infrastructure/whatsapp/whatsapp.factory.js";
import { isChannelEnabled } from "@/modules/ops/index.js";
import { pushDeviceService } from "../container.js";
import { notificationRepository } from "../container.js";
import type { PushMessage } from "@/infrastructure/push/push.port.js";
import { logger } from "@/utils/logger.js";

/** Must match app/vendor/lib/notifications.ts ANDROID_CHANNEL_* */
const ANDROID_CHANNEL_VENDOR_DEFAULT = "vendor-default";
const ANDROID_CHANNEL_VENDOR_JOBS = "vendor-jobs";
/** Must match app/user/lib/notifications.ts ANDROID_CHANNEL_* */
const ANDROID_CHANNEL_CUSTOMER_DEFAULT = "customer-default";
const ANDROID_CHANNEL_CUSTOMER_ORDERS = "customer-orders";

const URGENT_VENDOR_PUSH_EVENTS = new Set(["VENDOR_NEW_JOB", "VENDOR_JOB_ASSIGNED"]);
const VENDOR_PUSH_EVENTS = new Set([
    "VENDOR_NEW_JOB",
    "VENDOR_JOB_ASSIGNED",
    "PAYOUT_PAID",
    "PAYOUT_FAILED",
]);
const CUSTOMER_ORDER_PUSH_EVENTS = new Set([
    "BOOKING_CONFIRMED",
    "BOOKING_ASSIGNED",
    "VENDOR_EN_ROUTE",
    "VENDOR_ON_SITE",
    "BOOKING_COMPLETED",
    "BOOKING_REMINDER",
    "CHAT_MESSAGE",
]);

function androidPushOptions(event: string | undefined, eventData: Record<string, string>): Pick<
    PushMessage,
    "androidChannelId" | "priority"
> {
    const resolved = event ?? eventData.event;
    if (resolved && URGENT_VENDOR_PUSH_EVENTS.has(resolved)) {
        return { androidChannelId: ANDROID_CHANNEL_VENDOR_JOBS, priority: "high" };
    }
    if (resolved && VENDOR_PUSH_EVENTS.has(resolved)) {
        return { androidChannelId: ANDROID_CHANNEL_VENDOR_DEFAULT, priority: "default" };
    }
    if (resolved && CUSTOMER_ORDER_PUSH_EVENTS.has(resolved)) {
        return { androidChannelId: ANDROID_CHANNEL_CUSTOMER_ORDERS, priority: "high" };
    }
    return { androidChannelId: ANDROID_CHANNEL_CUSTOMER_DEFAULT, priority: "default" };
}

export type DeliverJobData = {
    notificationId: string;
    to?: string;
    subject?: string | null;
    body?: string;
    event?: string;
    channel?: string;
    userId?: string | null;
    eventData?: Record<string, string>;
};

async function finish(
    data: DeliverJobData,
    status: "SENT" | "FAILED" | "SKIPPED",
    provider: string,
    error?: string,
) {
    if (data.notificationId) {
        await notificationRepository.markNotification(data.notificationId, status, error ?? null);
        await notificationRepository.insertDelivery({
            notificationId: data.notificationId,
            provider,
            attempt: 1,
            error: error ?? null,
            status,
        });
    }
}

export async function processSmsDeliverJob(job: Job<DeliverJobData>): Promise<void> {
    if (!(await isChannelEnabled("sms"))) {
        await finish(job.data, "SKIPPED", "sms", "sms notifications disabled");
        return;
    }
    const to = job.data.to;
    const body = job.data.body;
    if (!to || !body) {
        await finish(job.data, "FAILED", "sms", "missing to/body");
        return;
    }
    await SmsFactory.getProvider().send({
        to,
        body,
        meta: {
            event: job.data.event,
            eventData: job.data.eventData,
        },
    });
    await finish(job.data, "SENT", "sms");
}

export async function processWhatsAppDeliverJob(job: Job<DeliverJobData>): Promise<void> {
    if (!(await isChannelEnabled("whatsapp"))) {
        await finish(job.data, "SKIPPED", "whatsapp", "whatsapp notifications disabled");
        return;
    }
    const to = job.data.to;
    if (!to) {
        await finish(job.data, "FAILED", "whatsapp", "missing to");
        return;
    }
    await WhatsAppFactory.getProvider().send({
        to,
        template: job.data.event ?? "transactional",
        data: job.data.eventData ?? {},
        meta: {
            event: job.data.event,
            eventData: job.data.eventData,
        },
    });
    await finish(job.data, "SENT", "whatsapp");
}

export async function processEmailDeliverJob(job: Job<DeliverJobData>): Promise<void> {
    if (!(await isChannelEnabled("email"))) {
        await finish(job.data, "SKIPPED", "smtp", "email notifications disabled");
        return;
    }
    const to = job.data.to;
    const body = job.data.body;
    if (!to || !body) {
        await finish(job.data, "FAILED", "smtp", "missing to/body");
        return;
    }
    await EmailFactory.getProvider().send({
        to,
        subject: job.data.subject || "Decoryy",
        html: body,
        text: body.replace(/<[^>]+>/g, ""),
    });
    await finish(job.data, "SENT", "smtp");
}

export async function processPushDeliverJob(job: Job<DeliverJobData>): Promise<void> {
    if (!(await isChannelEnabled("push"))) {
        await finish(job.data, "SKIPPED", "expo", "push notifications disabled");
        return;
    }

    const userId = job.data.userId;
    const title = job.data.subject || "Decoryy";
    const body = job.data.body ?? "";
    if (!userId || !body) {
        await finish(job.data, "SKIPPED", "expo", "userId/body required for push");
        return;
    }

    const tokens = await pushDeviceService.listTokensForUser(userId);
    if (tokens.length === 0) {
        await finish(job.data, "SKIPPED", "expo", "no push devices registered");
        return;
    }

    const provider = PushFactory.getProvider() as ExpoPushProvider;
    const pushData = job.data.eventData ?? {};
    const androidOptions = androidPushOptions(job.data.event, pushData);
    let sent = 0;

    for (const token of tokens) {
        try {
            const result = await provider.sendOne({
                to: token,
                title,
                body,
                data: pushData,
                ...androidOptions,
            });
            if (result.ok) {
                sent += 1;
                continue;
            }
            if (result.staleToken) {
                await pushDeviceService.removeStaleToken(token);
            }
            logger.warn({ token, error: result.error }, "expo push token failed");
        } catch (err) {
            logger.warn({ err, token }, "expo push send failed");
        }
    }

    if (sent > 0) {
        await finish(job.data, "SENT", "expo");
        return;
    }

    await finish(job.data, "FAILED", "expo", "all push tokens failed");
}

export async function processInAppDeliverJob(job: Job<DeliverJobData>): Promise<void> {
    const userId = job.data.userId;
    const body = job.data.body ?? "";
    if (!userId) {
        await finish(job.data, "SKIPPED", "inbox", "userId required for in-app");
        return;
    }
    await notificationRepository.insertInbox({
        userId,
        title: job.data.subject || "Decoryy",
        body,
        data: {
            event: job.data.event,
            notificationId: job.data.notificationId,
            ...(job.data.eventData ?? {}),
        },
    });
    await finish(job.data, "SENT", "inbox");
}
