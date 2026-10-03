import type { Job } from "bullmq";
import { buildBullJobId } from "@/infrastructure/queue/bull-job-id.js";
import { getDispatchService } from "@/modules/dispatch/index.js";
import { logger } from "@/utils/logger.js";

export async function processDispatchJob(job: Job): Promise<void> {
    const dispatch = getDispatchService();
    const name = job.name;

    if (name === "start") {
        const orderId = job.data.orderId as string;
        if (!orderId) return;
        await dispatch.startDispatch(orderId);
        return;
    }

    if (name === "expire") {
        const orderId = job.data.orderId as string;
        const offerId = job.data.offerId as string;
        if (!orderId || !offerId) return;
        await dispatch.expireOffer(offerId, orderId);
        return;
    }

    if (name === "expand") {
        const orderId = job.data.orderId as string;
        const waveIndex = Number(job.data.waveIndex ?? 0);
        if (!orderId) return;
        await dispatch.offerNext(orderId, waveIndex);
        return;
    }

    logger.warn({ jobName: name }, "unknown dispatch job");
}

export async function enqueueDispatchStart(orderId: string): Promise<void> {
    const { getQueues } = await import("@/infrastructure/queue/bull.connection.js");
    try {
        await getQueues().dispatch.add(
            "start",
            { orderId },
            { jobId: buildBullJobId("dispatch", "start", orderId), removeOnComplete: true },
        );
    } catch (err) {
        logger.error({ err, orderId }, "failed to enqueue dispatch start");
    }
}
