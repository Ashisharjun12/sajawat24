import DbFactory from "@/infrastructure/database/db.factory.js";

export function getQueueConnection() {
    return DbFactory.getRedisDatabase().getClient();
}

export const QUEUE_NAMES = {
    sms: "sms",
    notifyRelay: "notify.relay",
    notifyEmail: "notify.email",
    notifyPush: "notify.push",
    notifyInApp: "notify.in_app",
    notifyWhatsapp: "notify.whatsapp",
    assignmentReminder: "assignment.reminder",
    paymentsWebhookRetry: "payments.webhook-retry",
    ledgerPostOnComplete: "ledger.post-on-complete",
    imageOptimize: "image.optimize",
    dispatch: "dispatch",
    presenceSweep: "presence.sweep",
} as const;
