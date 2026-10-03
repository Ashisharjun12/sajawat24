import type { Job } from "bullmq";
import { getQueues, type AppQueues } from "@/infrastructure/queue/bull.connection.js";
import { QUEUE_NAMES } from "@/infrastructure/queue/queues.js";
import type { DeliverJobData } from "@/modules/notifications/jobs/deliver.job.js";
import { notificationRepository } from "../container.js";
import type { NotificationOutbox } from "@/modules/notifications/schema.js";
import { logger } from "@/utils/logger.js";

export type RelayJobData = {
    outboxId?: string;
};

function isDuplicateJob(err: unknown): boolean {
    const message = err instanceof Error ? err.message : String(err);
    return /already exists|already waiting|already delayed/i.test(message);
}

function deliverQueue(queueName: string): AppQueues[keyof AppQueues] | null {
    const queues = getQueues();
    switch (queueName) {
        case QUEUE_NAMES.sms:
            return queues.sms;
        case QUEUE_NAMES.notifyEmail:
            return queues.notifyEmail;
        case QUEUE_NAMES.notifyPush:
            return queues.notifyPush;
        case QUEUE_NAMES.notifyInApp:
            return queues.notifyInApp;
        case QUEUE_NAMES.notifyWhatsapp:
            return queues.notifyWhatsapp;
        default:
            return null;
    }
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" && value.length > 0 ? value : undefined;
}

function toDeliverPayload(row: NotificationOutbox): DeliverJobData {
    const payload = row.payload;
    const eventDataRaw = payload.eventData;
    let eventData: Record<string, string> | undefined;
    if (eventDataRaw && typeof eventDataRaw === "object" && !Array.isArray(eventDataRaw)) {
        eventData = {};
        for (const [key, value] of Object.entries(eventDataRaw as Record<string, unknown>)) {
            if (typeof value === "string") {
                eventData[key] = value;
            }
        }
    }
    return {
        notificationId: row.notificationId,
        to: asString(payload.to),
        subject: asString(payload.subject) ?? (payload.subject === null ? null : undefined),
        body: asString(payload.body),
        event: asString(payload.event),
        channel: asString(payload.channel),
        userId: asString(payload.userId) ?? null,
        eventData,
    };
}

async function enqueueRow(row: NotificationOutbox): Promise<void> {
    const queue = deliverQueue(row.queue);
    if (!queue) {
        logger.error({ queue: row.queue, outboxId: row.id }, "unknown notify queue");
        await notificationRepository.resetOutboxClaim(row.id);
        return;
    }

    try {
        await queue.add("send", toDeliverPayload(row), {
            jobId: row.notificationId,
            attempts: 3,
            backoff: { type: "exponential", delay: 2000 },
            removeOnComplete: true,
        });
    } catch (err) {
        if (isDuplicateJob(err)) {
            return;
        }
        await notificationRepository.resetOutboxClaim(row.id);
        throw err;
    }
}

export async function processRelayJob(job: Job<RelayJobData>): Promise<void> {
    const data = job.data ?? {};
    if (data.outboxId) {
        const row = await notificationRepository.claimOutboxById(data.outboxId);
        if (row) await enqueueRow(row);
        return;
    }

    const rows = await notificationRepository.claimOutbox(50);
    for (const row of rows) {
        try {
            await enqueueRow(row);
        } catch (err) {
            logger.error({ err, outboxId: row.id }, "notify relay enqueue failed");
        }
    }
}
