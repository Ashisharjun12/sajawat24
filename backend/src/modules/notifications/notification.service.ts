import { _config } from "@/config/config.js";
import { isChannelEnabled } from "@/modules/ops/index.js";
import type { NotificationChannel as OpsChannel } from "@/modules/ops/settings/notification-channels.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { QUEUE_NAMES } from "@/infrastructure/queue/queues.js";
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import type { PreferenceService } from "@/modules/notifications/preferences/preference.service.js";
import type { TemplateService } from "@/modules/notifications/templates/template.service.js";
import {
    EVENT_POLICIES,
    type NotificationEvent,
} from "@/modules/notifications/policy/events.js";
import {
    bookingTrackUrl,
    formatLoginOtpSms,
    interpolate,
} from "@/modules/notifications/lib/render.js";
import {
    parseBookingEmailItems,
    renderBookingConfirmedHtml,
    formatBookingSchedule,
} from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import {
    renderTripStatusEmailHtml,
    tripEventToVariant,
} from "@/modules/notifications/templates/email/trip-status.render.js";
import { renderDispatchExhaustedEmailHtml } from "@/modules/notifications/templates/email/dispatch-exhausted.render.js";
import type { NotificationChannel } from "@/modules/notifications/schema.js";
import { normalizePhoneForSms } from "@/modules/identity/auth/phone.js";
import { logger } from "@/utils/logger.js";

export type NotifyRecipient = {
    phone?: string | null;
    email?: string | null;
};

export type NotifyInput = {
    event: NotificationEvent;
    userId?: string | null;
    recipient?: NotifyRecipient;
    data: Record<string, string>;
    idempotencyKey: string;
    scheduledAt?: Date | null;
    /** When set, only dispatch these channels (subset of EVENT_POLICIES). */
    channels?: NotificationChannel[];
};

export interface INotificationService {
    canDeliverLoginOtp(): Promise<boolean>;
    assertCanSend(event: NotificationEvent): Promise<void>;
    notify(input: NotifyInput): Promise<void>;
}

function toOpsChannel(channel: NotificationChannel): OpsChannel {
    if (channel === "in_app") return "inApp";
    return channel;
}

function resolveTemplateData(
    input: NotifyInput,
    channel: NotificationChannel,
): Record<string, string> {
    const data = { ...input.data };
    if (channel !== "sms" && channel !== "whatsapp") return data;

    const tripEvents = new Set([
        "BOOKING_CONFIRMED",
        "BOOKING_ASSIGNED",
        "BOOKING_REMINDER",
        "VENDOR_EN_ROUTE",
        "VENDOR_ON_SITE",
        "DELIVERY_CODE",
        "BOOKING_COMPLETED",
    ]);
    if (tripEvents.has(input.event)) {
        const orderId = data.bookingId || data.orderId || "";
        if (!data.trackUrl && orderId) {
            data.trackUrl = bookingTrackUrl(orderId);
        }
        if (data.scheduledAt?.includes("T")) {
            data.scheduledAt = formatBookingSchedule(data.scheduledAt);
        }
    }

    return data;
}

function queueFor(channel: NotificationChannel): string | null {
    switch (channel) {
        case "sms":
            return QUEUE_NAMES.sms;
        case "email":
            return QUEUE_NAMES.notifyEmail;
        case "push":
            return QUEUE_NAMES.notifyPush;
        case "in_app":
            return QUEUE_NAMES.notifyInApp;
        case "whatsapp":
            return QUEUE_NAMES.notifyWhatsapp;
        default:
            return null;
    }
}

export class NotificationService implements INotificationService {
    constructor(
        private readonly repo: NotificationRepository,
        private readonly templates: TemplateService,
        private readonly prefs: PreferenceService,
    ) {}

    async canDeliverLoginOtp(): Promise<boolean> {
        const sms = await isChannelEnabled("sms");
        const whatsapp = await isChannelEnabled("whatsapp");
        return sms || whatsapp;
    }

    async assertCanSend(event: NotificationEvent): Promise<void> {
        if (event === "LOGIN_OTP") {
            if (_config.NODE_ENV === "development") {
                return;
            }
            if (!(await this.canDeliverLoginOtp())) {
                throw new ApiError(
                    503,
                    "phone notifications disabled (enable SMS or WhatsApp in admin settings)",
                );
            }
            return;
        }

        const policy = EVENT_POLICIES[event];
        for (const channel of policy.channels) {
            if (!channel.required) continue;
            const enabled = await isChannelEnabled(toOpsChannel(channel.channel));
            if (!enabled) {
                throw new ApiError(503, `${channel.channel} notifications disabled`);
            }
        }
    }

    async notify(input: NotifyInput): Promise<void> {
        const existing = await this.repo.findByIdempotencyKey(input.idempotencyKey);
        if (existing) return;

        const policy = EVENT_POLICIES[input.event];
        const userPrefs = input.userId ? await this.prefs.get(input.userId) : null;

        for (const channelPolicy of policy.channels) {
            if (input.channels && !input.channels.includes(channelPolicy.channel)) {
                continue;
            }

            const idempotencyKey =
                policy.channels.length === 1
                    ? input.idempotencyKey
                    : `${input.idempotencyKey}:${channelPolicy.channel}`;

            const dup = await this.repo.findByIdempotencyKey(idempotencyKey);
            if (dup) continue;

            await this.dispatchChannel(input, channelPolicy, userPrefs, idempotencyKey);
        }
    }

    private async dispatchChannel(
        input: NotifyInput,
        channelPolicy: (typeof EVENT_POLICIES)[NotificationEvent]["channels"][number],
        userPrefs: Awaited<ReturnType<PreferenceService["get"]>> | null,
        idempotencyKey: string,
    ): Promise<void> {
        const platformOn = await isChannelEnabled(toOpsChannel(channelPolicy.channel));
        if (!platformOn) {
            if (channelPolicy.required) {
                throw new ApiError(503, `${channelPolicy.channel} notifications disabled`);
            }
            await this.repo.insertIntent({
                userId: input.userId ?? null,
                event: input.event,
                templateId: null,
                channel: channelPolicy.channel,
                priority: channelPolicy.priority,
                payload: { reason: "platform_disabled" },
                status: "SKIPPED",
                idempotencyKey,
                scheduledAt: input.scheduledAt ?? null,
                error: "platform channel disabled",
                outbox: null,
            });
            return;
        }

        if (channelPolicy.type === "promotional" && userPrefs) {
            const promoOk =
                channelPolicy.channel === "email"
                    ? userPrefs.promotionalEmail
                    : channelPolicy.channel === "sms"
                      ? userPrefs.promotionalSms
                      : userPrefs[channelPolicy.channel === "in_app" ? "inApp" : channelPolicy.channel];
            if (!promoOk) {
                await this.repo.insertIntent({
                    userId: input.userId ?? null,
                    event: input.event,
                    templateId: null,
                    channel: channelPolicy.channel,
                    priority: channelPolicy.priority,
                    payload: { reason: "user_pref" },
                    status: "SKIPPED",
                    idempotencyKey,
                    scheduledAt: input.scheduledAt ?? null,
                    error: "user preference",
                    outbox: null,
                });
                return;
            }
        }

        let templateRow;
        try {
            templateRow = await this.templates.getActive(
                channelPolicy.templateKey,
                channelPolicy.channel,
            );
        } catch (err) {
            if (channelPolicy.required) throw err;
            logger.warn({ event: input.event, channel: channelPolicy.channel }, "template missing");
            return;
        }

        const to =
            channelPolicy.channel === "sms" || channelPolicy.channel === "whatsapp"
                ? normalizePhoneForSms(input.recipient?.phone ?? "") ?? undefined
                : channelPolicy.channel === "email"
                  ? input.recipient?.email
                  : input.userId;

        if (!to) {
            if (channelPolicy.required) {
                throw ApiError.badRequest(`${channelPolicy.channel} recipient missing`);
            }
            await this.repo.insertIntent({
                userId: input.userId ?? null,
                event: input.event,
                templateId: templateRow.template.id,
                channel: channelPolicy.channel,
                priority: channelPolicy.priority,
                payload: { reason: "no_recipient" },
                status: "SKIPPED",
                idempotencyKey,
                scheduledAt: input.scheduledAt ?? null,
                error: "recipient missing",
                outbox: null,
            });
            return;
        }

        const queue = queueFor(channelPolicy.channel);
        if (!queue) {
            await this.repo.insertIntent({
                userId: input.userId ?? null,
                event: input.event,
                templateId: templateRow.template.id,
                channel: channelPolicy.channel,
                priority: channelPolicy.priority,
                payload: { reason: "provider_unavailable" },
                status: "SKIPPED",
                idempotencyKey,
                scheduledAt: input.scheduledAt ?? null,
                error: "channel provider not implemented",
                outbox: null,
            });
            return;
        }

        const templateData = resolveTemplateData(input, channelPolicy.channel);
        let body = interpolate(
            templateRow.version.content,
            templateData,
            templateRow.version.variables,
        );
        if (
            input.event === "LOGIN_OTP" &&
            (channelPolicy.channel === "sms" || channelPolicy.channel === "whatsapp")
        ) {
            body = formatLoginOtpSms(input.data.otp, input.data.androidAppHash);
        }
        if (input.event === "BOOKING_CONFIRMED" && channelPolicy.channel === "email") {
            body = await renderBookingConfirmedHtml({
                intro: body,
                customerName: input.data.customerName ?? "",
                customerPhone: input.data.customerPhone ?? input.data.phone ?? "",
                orderRef: input.data.orderRef || input.data.orderId || "",
                scheduledAt: formatBookingSchedule(input.data.scheduledAt ?? ""),
                city: input.data.city ?? "",
                address: input.data.address ?? "",
                totalPaise: Number(input.data.totalPaise) || 0,
                orderId: input.data.bookingId || "",
                items: parseBookingEmailItems(input.data.itemsJson),
            });
        }
        if (input.event === "DISPATCH_EXHAUSTED" && channelPolicy.channel === "email") {
            body = await renderDispatchExhaustedEmailHtml({
                intro: body,
                orderRef: input.data.orderRef || input.data.orderId || "",
                city: input.data.city ?? "",
                address: input.data.address ?? "",
                adminUrl: input.data.adminUrl ?? "",
            });
        }
        const tripVariant = tripEventToVariant(input.event);
        if (tripVariant && channelPolicy.channel === "email") {
            body = await renderTripStatusEmailHtml({
                variant: tripVariant,
                intro: body,
                customerName: input.data.customerName ?? "",
                orderRef: input.data.orderRef || input.data.orderId || "",
                scheduledAt: input.data.scheduledAt ?? "",
                vendorName: input.data.vendorName ?? "Your decorator",
                vendorPhone: input.data.vendorPhone,
                address: input.data.address,
                cityName: input.data.cityName,
                code: input.data.code,
                trackUrl: input.data.trackUrl || bookingTrackUrl(input.data.bookingId || input.data.orderId || ""),
                orderId: input.data.bookingId || input.data.orderId || "",
            });
        }
        const subject = templateRow.version.subject
            ? interpolate(templateRow.version.subject, templateData, [])
            : null;

        const { outboxId } = await this.repo.insertIntent({
            userId: input.userId ?? null,
            event: input.event,
            templateId: templateRow.template.id,
            channel: channelPolicy.channel,
            priority: channelPolicy.priority,
            payload: {
                to,
                subject,
                body,
                event: input.event,
            },
            status: input.scheduledAt ? "SCHEDULED" : "PENDING",
            idempotencyKey,
            scheduledAt: input.scheduledAt ?? null,
            error: null,
            outbox: input.scheduledAt
                ? null
                : {
                      queue,
                      payload: {
                          to,
                          subject,
                          body,
                          event: input.event,
                          channel: channelPolicy.channel,
                          userId: input.userId ?? null,
                          eventData: {
                              event: input.event,
                              ...input.data,
                          },
                      },
                  },
        });

        if (outboxId) {
            try {
                await getQueues().notifyRelay.add(
                    "publish",
                    { outboxId },
                    {
                        jobId: `outbox-${outboxId}`,
                        attempts: 5,
                        backoff: { type: "exponential", delay: 1000 },
                    },
                );
            } catch (err) {
                logger.error(
                    { err, outboxId, notificationId: input.idempotencyKey },
                    "notify relay enqueue failed; worker sweep will retry",
                );
            }
        }
    }
}
