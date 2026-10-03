import { Queue } from "bullmq";
import { getQueueConnection, QUEUE_NAMES } from "@/infrastructure/queue/queues.js";

export type AppQueues = {
    sms: Queue;
    notifyRelay: Queue;
    notifyEmail: Queue;
    notifyPush: Queue;
    notifyInApp: Queue;
    notifyWhatsapp: Queue;
    assignmentReminder: Queue;
    paymentsWebhookRetry: Queue;
    ledgerPostOnComplete: Queue;
    imageOptimize: Queue;
    dispatch: Queue;
    presenceSweep: Queue;
};

let queues: AppQueues | null = null;

export function getQueues(): AppQueues {
    if (queues) return queues;

    const connection = getQueueConnection();
    queues = {
        sms: new Queue(QUEUE_NAMES.sms, { connection }),
        notifyRelay: new Queue(QUEUE_NAMES.notifyRelay, { connection }),
        notifyEmail: new Queue(QUEUE_NAMES.notifyEmail, { connection }),
        notifyPush: new Queue(QUEUE_NAMES.notifyPush, { connection }),
        notifyInApp: new Queue(QUEUE_NAMES.notifyInApp, { connection }),
        notifyWhatsapp: new Queue(QUEUE_NAMES.notifyWhatsapp, { connection }),
        assignmentReminder: new Queue(QUEUE_NAMES.assignmentReminder, { connection }),
        paymentsWebhookRetry: new Queue(QUEUE_NAMES.paymentsWebhookRetry, { connection }),
        ledgerPostOnComplete: new Queue(QUEUE_NAMES.ledgerPostOnComplete, { connection }),
        imageOptimize: new Queue(QUEUE_NAMES.imageOptimize, { connection }),
        dispatch: new Queue(QUEUE_NAMES.dispatch, { connection }),
        presenceSweep: new Queue(QUEUE_NAMES.presenceSweep, { connection }),
    };
    return queues;
}
