import { buildBullJobId } from "@/infrastructure/queue/bull-job-id.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { logger } from "@/utils/logger.js";

const REMINDER_OFFSETS = [
    { key: "24h", ms: 24 * 60 * 60 * 1000 },
    { key: "4h", ms: 4 * 60 * 60 * 1000 },
] as const;

export async function scheduleBookingReminders(
    orderId: string,
    scheduledAt: Date,
): Promise<void> {
    try {
        const queue = getQueues().assignmentReminder;
        const now = Date.now();
        const slotMs = scheduledAt.getTime();

        for (const offset of REMINDER_OFFSETS) {
            const delay = slotMs - offset.ms - now;
            if (delay <= 0) {
                continue;
            }

            await queue.add(
                "reminder",
                { orderId, offsetKey: offset.key },
                {
                    jobId: buildBullJobId("reminder", orderId, offset.key),
                    delay,
                    removeOnComplete: true,
                    removeOnFail: true,
                },
            );
        }
    } catch (err) {
        logger.error({ err, orderId }, "schedule booking reminders failed");
    }
}

export async function cancelBookingReminders(orderId: string): Promise<void> {
    try {
        const queue = getQueues().assignmentReminder;
        for (const offset of REMINDER_OFFSETS) {
            const job = await queue.getJob(buildBullJobId("reminder", orderId, offset.key));
            if (job) {
                await job.remove();
            }
        }
    } catch (err) {
        logger.error({ err, orderId }, "cancel booking reminders failed");
    }
}
