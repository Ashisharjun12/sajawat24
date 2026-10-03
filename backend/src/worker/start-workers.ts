import { Redis } from "ioredis";
import { Worker, type Worker as BullWorker } from "bullmq";
import { _config } from "@/config/config.js";
import DbFactory from "@/infrastructure/database/db.factory.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { QUEUE_NAMES } from "@/infrastructure/queue/queues.js";
import {
    processEmailDeliverJob,
    processInAppDeliverJob,
    processPushDeliverJob,
    processSmsDeliverJob,
    processWhatsAppDeliverJob,
} from "@/modules/notifications/jobs/deliver.job.js";
import { processRelayJob } from "@/modules/notifications/jobs/relay.job.js";
import { processOptimizeJob } from "@/modules/upload/media/optimize.job.js";
import { processLedgerPostOnCompleteJob } from "@/modules/payments/jobs/ledger-post-on-complete.job.js";
import { processPaymentWebhookRetryJob } from "@/modules/payments/jobs/payment-webhook-retry.job.js";
import { processAssignmentReminderJob } from "@/modules/assignment/jobs/assignment.job.js";
import { processDispatchJob } from "@/modules/dispatch/jobs/dispatch.job.js";
import { processDispatchReconcileJob } from "@/modules/dispatch/jobs/dispatch-reconcile.job.js";
import { processPresenceSweepJob } from "@/modules/dispatch/jobs/presence-sweep.job.js";
import { processStalePendingPaymentJob } from "@/modules/booking/jobs/stale-pending-payment.job.js";
import { processSettlementSweepJob } from "@/modules/payments/jobs/settlement.job.js";
import { logger } from "@/utils/logger.js";

let workers: BullWorker[] = [];
let sweepTimer: ReturnType<typeof setInterval> | null = null;
let started = false;

function scheduleSweep(): void {
    void getQueues()
        .notifyRelay.add(
            "sweep",
            {},
            {
                jobId: "notify-relay-sweep",
                removeOnComplete: true,
                removeOnFail: true,
            },
        )
        .catch((err: unknown) => {
            const message = err instanceof Error ? err.message : String(err);
            if (/already exists|already waiting|already delayed/i.test(message)) return;
            logger.error({ err }, "failed to schedule notify relay sweep");
        });
}

export async function startNotificationWorkers(): Promise<void> {
    if (started) return;
    started = true;

    await DbFactory.connectRedis();

    const redisUrl = _config.REDIS_URL;
    if (!redisUrl) {
        throw new Error("REDIS_URL is missing from environment");
    }

    const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

    workers = [
        new Worker(QUEUE_NAMES.notifyRelay, processRelayJob, { connection, concurrency: 1 }),
        new Worker(QUEUE_NAMES.sms, processSmsDeliverJob, { connection, concurrency: 5 }),
        new Worker(QUEUE_NAMES.notifyEmail, processEmailDeliverJob, { connection, concurrency: 3 }),
        new Worker(QUEUE_NAMES.notifyPush, processPushDeliverJob, { connection, concurrency: 3 }),
        new Worker(QUEUE_NAMES.notifyInApp, processInAppDeliverJob, { connection, concurrency: 5 }),
        new Worker(QUEUE_NAMES.notifyWhatsapp, processWhatsAppDeliverJob, { connection, concurrency: 5 }),
        new Worker(QUEUE_NAMES.imageOptimize, processOptimizeJob, { connection, concurrency: 2 }),
        new Worker(QUEUE_NAMES.paymentsWebhookRetry, processPaymentWebhookRetryJob, {
            connection,
            concurrency: 3,
        }),
        new Worker(QUEUE_NAMES.ledgerPostOnComplete, processLedgerPostOnCompleteJob, {
            connection,
            concurrency: 2,
        }),
        new Worker(QUEUE_NAMES.assignmentReminder, processAssignmentReminderJob, {
            connection,
            concurrency: 2,
        }),
        new Worker(QUEUE_NAMES.dispatch, processDispatchJob, { connection, concurrency: 2 }),
        new Worker(QUEUE_NAMES.presenceSweep, async () => {
            await processPresenceSweepJob();
        }, { connection, concurrency: 1 }),
    ];

    for (const worker of workers) {
        worker.on("failed", (job, err) => {
            logger.error({ jobId: job?.id, queue: worker.name, err }, "worker job failed");
        });
    }

    void scheduleSweep();
    void processSettlementSweepJob().catch((err) => {
        logger.error({ err }, "initial settlement sweep failed");
    });
    void processPresenceSweepJob().catch((err) => {
        logger.error({ err }, "initial presence sweep failed");
    });
    void processDispatchReconcileJob().catch((err) => {
        logger.error({ err }, "initial dispatch reconcile failed");
    });
    sweepTimer = setInterval(() => {
        void scheduleSweep();
        void processSettlementSweepJob().catch((err) => {
            logger.error({ err }, "settlement sweep failed");
        });
        void processPresenceSweepJob().catch((err) => {
            logger.error({ err }, "presence sweep failed");
        });
        void processDispatchReconcileJob().catch((err) => {
            logger.error({ err }, "dispatch reconcile failed");
        });
        void processStalePendingPaymentJob().catch((err) => {
            logger.error({ err }, "stale pending payment sweep failed");
        });
    }, 60_000);

    logger.info(
        {
            queues: [
                QUEUE_NAMES.notifyRelay,
                QUEUE_NAMES.sms,
                QUEUE_NAMES.notifyEmail,
                QUEUE_NAMES.notifyPush,
                QUEUE_NAMES.notifyInApp,
                QUEUE_NAMES.notifyWhatsapp,
                QUEUE_NAMES.imageOptimize,
                QUEUE_NAMES.paymentsWebhookRetry,
                QUEUE_NAMES.ledgerPostOnComplete,
                QUEUE_NAMES.assignmentReminder,
                QUEUE_NAMES.dispatch,
                QUEUE_NAMES.presenceSweep,
            ],
        },
        "Decory notification workers started",
    );
}

export async function stopNotificationWorkers(): Promise<void> {
    if (!started) return;
    if (sweepTimer) {
        clearInterval(sweepTimer);
        sweepTimer = null;
    }
    await Promise.all(workers.map((worker) => worker.close()));
    workers = [];
    started = false;
}
