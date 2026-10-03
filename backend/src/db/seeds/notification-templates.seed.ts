import { and, eq } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import {
    notificationTemplateVersions,
    notificationTemplates,
    type NotificationChannel,
    type NotificationTemplateType,
} from "@/modules/notifications/schema.js";

export type NotificationTemplateSeed = {
    key: string;
    name: string;
    type: NotificationTemplateType;
    channel: NotificationChannel;
    locale: string;
    editable: boolean;
    subject: string | null;
    content: string;
    variables: string[];
};

/** Default templates required by policy/events.ts */
export const NOTIFICATION_TEMPLATE_SEEDS: NotificationTemplateSeed[] = [
    {
        key: "login_otp",
        name: "Login OTP",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: false,
        subject: null,
        content: "Your Decoryy code is {{otp}}. Valid for 5 minutes.",
        variables: ["otp"],
    },
    {
        key: "booking_confirmed",
        name: "Booking confirmed",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Booking confirmed — {{orderRef}}",
        content:
            "Hi {{customerName}}, your booking {{orderRef}} is confirmed for {{scheduledAt}}.",
        variables: [
            "customerName",
            "orderRef",
            "scheduledAt",
            "city",
            "address",
            "totalPaise",
            "bookingId",
            "orderId",
            "itemsJson",
            "trackUrl",
        ],
    },
    {
        key: "booking_confirmed",
        name: "Booking confirmed SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Hi {{customerName}}, booking {{orderRef}} confirmed for {{scheduledAt}}. Track: {{trackUrl}}",
        variables: ["customerName", "orderRef", "scheduledAt", "trackUrl", "bookingId", "orderId"],
    },
    {
        key: "booking_confirmed",
        name: "Booking confirmed push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Booking confirmed — {{orderRef}}",
        content: "Your booking for {{scheduledAt}} is confirmed.",
        variables: ["customerName", "orderRef", "scheduledAt", "trackUrl", "bookingId", "orderId"],
    },
    {
        key: "booking_confirmed",
        name: "Booking confirmed in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Booking confirmed — {{orderRef}}",
        content: "Your booking for {{scheduledAt}} is confirmed.",
        variables: ["customerName", "orderRef", "scheduledAt", "trackUrl", "bookingId", "orderId"],
    },
    {
        key: "booking_assigned",
        name: "Vendor assigned",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Vendor assigned — {{orderRef}}",
        content:
            "Hi {{customerName}}, vendor {{vendorName}} is assigned to booking {{orderRef}} ({{scheduledAt}}). Track: {{trackUrl}}",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "scheduledAt",
            "address",
            "trackUrl",
            "bookingId",
        ],
    },
    {
        key: "booking_assigned",
        name: "Vendor assigned SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Vendor {{vendorName}} assigned to {{orderRef}} on {{scheduledAt}}. Track: {{trackUrl}}",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "scheduledAt",
            "trackUrl",
            "bookingId",
        ],
    },
    {
        key: "booking_assigned",
        name: "Vendor assigned push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Decorator assigned — {{orderRef}}",
        content: "{{vendorName}} is assigned to your booking on {{scheduledAt}}.",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "scheduledAt",
            "trackUrl",
            "bookingId",
            "orderId",
        ],
    },
    {
        key: "booking_assigned",
        name: "Vendor assigned in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Decorator assigned — {{orderRef}}",
        content: "{{vendorName}} is assigned to your booking on {{scheduledAt}}.",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "scheduledAt",
            "trackUrl",
            "bookingId",
            "orderId",
        ],
    },
    {
        key: "vendor_en_route",
        name: "Vendor en route email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "On the way — {{orderRef}}",
        content:
            "Hi {{customerName}}, great news — {{vendorName}} is on the way to your venue for booking {{orderRef}}.",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "trackUrl",
            "bookingId",
            "scheduledAt",
            "address",
            "cityName",
        ],
    },
    {
        key: "vendor_en_route",
        name: "Vendor en route SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: {{vendorName}} is on the way for {{orderRef}}. Track: {{trackUrl}}",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "scheduledAt"],
    },
    {
        key: "vendor_en_route",
        name: "Vendor en route push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "On the way — {{orderRef}}",
        content: "{{vendorName}} is on the way for your booking {{orderRef}}.",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId", "scheduledAt"],
    },
    {
        key: "vendor_en_route",
        name: "Vendor en route in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "On the way — {{orderRef}}",
        content: "{{vendorName}} is on the way for your booking {{orderRef}}.",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId", "scheduledAt"],
    },
    {
        key: "vendor_on_site",
        name: "Vendor on site email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Decorator arrived — {{orderRef}}",
        content:
            "Hi {{customerName}}, {{vendorName}} has arrived at your venue. Setup for booking {{orderRef}} will begin shortly.",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "trackUrl",
            "bookingId",
            "scheduledAt",
            "address",
            "cityName",
        ],
    },
    {
        key: "vendor_on_site",
        name: "Vendor on site SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: {{vendorName}} has arrived for {{orderRef}}. Setup will begin shortly.",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "scheduledAt"],
    },
    {
        key: "vendor_on_site",
        name: "Vendor on site push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Decorator arrived — {{orderRef}}",
        content: "{{vendorName}} has arrived for {{orderRef}}.",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId", "scheduledAt"],
    },
    {
        key: "vendor_on_site",
        name: "Vendor on site in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Decorator arrived — {{orderRef}}",
        content: "{{vendorName}} has arrived for {{orderRef}}.",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId", "scheduledAt"],
    },
    {
        key: "delivery_code",
        name: "Delivery code email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Completion code — {{orderRef}}",
        content:
            "Hi {{customerName}}, setup for booking {{orderRef}} is wrapping up. Use the code below when {{vendorName}} asks for it.",
        variables: [
            "customerName",
            "orderRef",
            "code",
            "vendorName",
            "vendorPhone",
            "bookingId",
            "address",
            "cityName",
        ],
    },
    {
        key: "delivery_code",
        name: "Delivery code SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Your completion code for {{orderRef}} is {{code}}. Share with your decorator when setup is done.",
        variables: ["customerName", "orderRef", "code", "vendorName", "bookingId"],
    },
    {
        key: "booking_completed",
        name: "Booking completed email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Booking complete — {{orderRef}}",
        content:
            "Hi {{customerName}}, your decoration for booking {{orderRef}} is complete. We hope you love how it turned out — thank you for choosing Decoryy!",
        variables: [
            "customerName",
            "orderRef",
            "vendorName",
            "vendorPhone",
            "trackUrl",
            "bookingId",
            "address",
            "cityName",
        ],
    },
    {
        key: "booking_completed",
        name: "Booking completed SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content: "Decoryy: Booking {{orderRef}} is complete. Thank you!",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId"],
    },
    {
        key: "booking_completed",
        name: "Booking completed push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Booking complete — {{orderRef}}",
        content: "Your decoration for {{orderRef}} is complete. Thank you!",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId"],
    },
    {
        key: "booking_completed",
        name: "Booking completed in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Booking complete — {{orderRef}}",
        content: "Your decoration for {{orderRef}} is complete. Thank you!",
        variables: ["customerName", "orderRef", "vendorName", "trackUrl", "bookingId", "orderId"],
    },
    {
        key: "vendor_new_job",
        name: "New job push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "New job — {{orderRef}}",
        content: "New booking {{orderRef}} on {{scheduledAt}}. {{address}}",
        variables: ["orderRef", "scheduledAt", "address", "orderId"],
    },
    {
        key: "vendor_new_job",
        name: "New job in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "New job — {{orderRef}}",
        content: "New booking {{orderRef}} on {{scheduledAt}}. {{address}}",
        variables: ["orderRef", "scheduledAt", "address", "orderId"],
    },
    {
        key: "vendor_new_job",
        name: "New job SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: New job {{orderRef}} on {{scheduledAt}} at {{address}}. Open vendor app.",
        variables: ["orderRef", "scheduledAt", "address", "orderId"],
    },
    {
        key: "vendor_job_assigned",
        name: "Job assigned to worker push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Job assigned — {{orderRef}}",
        content: "You were assigned to job {{orderRef}}. Open the partner app to view details.",
        variables: ["orderRef", "orderId", "bookingId", "scheduledAt", "address"],
    },
    {
        key: "vendor_job_assigned",
        name: "Job assigned to worker in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Job assigned — {{orderRef}}",
        content: "You were assigned to job {{orderRef}}. Tap to open the job.",
        variables: ["orderRef", "orderId", "bookingId", "scheduledAt", "address"],
    },
    {
        key: "vendor_job_assigned",
        name: "Job assigned to worker SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: You were assigned job {{orderRef}} on {{scheduledAt}} at {{address}}. Open partner app.",
        variables: ["orderRef", "scheduledAt", "address", "orderId", "bookingId"],
    },
    {
        key: "booking_reminder",
        name: "Booking reminder SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Reminder — booking {{orderRef}} is scheduled for {{scheduledAt}}. Track: {{trackUrl}}",
        variables: [
            "customerName",
            "orderRef",
            "scheduledAt",
            "trackUrl",
            "bookingId",
            "orderId",
            "reminderOffset",
        ],
    },
    {
        key: "booking_reminder",
        name: "Booking reminder push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Upcoming booking — {{orderRef}}",
        content: "Your decoration is scheduled for {{scheduledAt}}.",
        variables: [
            "customerName",
            "orderRef",
            "scheduledAt",
            "trackUrl",
            "bookingId",
            "orderId",
            "reminderOffset",
        ],
    },
    {
        key: "booking_reminder",
        name: "Booking reminder in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Upcoming booking — {{orderRef}}",
        content: "Your decoration is scheduled for {{scheduledAt}}.",
        variables: [
            "customerName",
            "orderRef",
            "scheduledAt",
            "trackUrl",
            "bookingId",
            "orderId",
            "reminderOffset",
        ],
    },
    {
        key: "chat_message",
        name: "Chat message push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "{{senderName}}",
        content: "{{preview}}",
        variables: ["senderName", "preview", "conversationId", "conversationType", "orderId", "orderRef"],
    },
    {
        key: "chat_message",
        name: "Chat message in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "{{senderName}}",
        content: "{{preview}}",
        variables: ["senderName", "preview", "conversationId", "conversationType", "orderId", "orderRef"],
    },
    {
        key: "dispatch_exhausted",
        name: "Dispatch exhausted (admin)",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Action needed — no vendor for {{orderRef}}",
        content:
            "Instant dispatch could not place {{orderRef}} with an available partner in {{city}}. Please assign a vendor manually.",
        variables: ["orderRef", "city", "address", "adminUrl", "orderId"],
    },
    {
        key: "payout_paid",
        name: "Payout paid email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Payout sent — {{amountFormatted}}",
        content:
            "Hi {{vendorName}}, your withdrawal of {{amountFormatted}} has been processed and sent to {{payoutDestination}}.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
        ],
    },
    {
        key: "payout_paid",
        name: "Payout paid SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Your payout of {{amountFormatted}} was sent to {{payoutDestination}}. Open the vendor app for details.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
        ],
    },
    {
        key: "payout_paid",
        name: "Payout paid push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Payout sent — {{amountFormatted}}",
        content: "{{amountFormatted}} sent to {{payoutDestination}}.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
        ],
    },
    {
        key: "payout_paid",
        name: "Payout paid in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Payout sent — {{amountFormatted}}",
        content: "{{amountFormatted}} sent to {{payoutDestination}}.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
        ],
    },
    {
        key: "payout_failed",
        name: "Payout failed email",
        type: "transactional",
        channel: "email",
        locale: "en",
        editable: true,
        subject: "Payout could not be completed — {{amountFormatted}}",
        content:
            "Hi {{vendorName}}, we could not complete your withdrawal of {{amountFormatted}}. Reason: {{failureReason}}. The amount has been returned to your wallet.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
            "failureReason",
        ],
    },
    {
        key: "payout_failed",
        name: "Payout failed SMS",
        type: "transactional",
        channel: "sms",
        locale: "en",
        editable: true,
        subject: null,
        content:
            "Decoryy: Payout of {{amountFormatted}} failed. {{failureReason}} Amount returned to your wallet.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
            "failureReason",
        ],
    },
    {
        key: "payout_failed",
        name: "Payout failed push",
        type: "transactional",
        channel: "push",
        locale: "en",
        editable: true,
        subject: "Payout failed — {{amountFormatted}}",
        content: "{{failureReason}} Amount returned to your wallet.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
            "failureReason",
        ],
    },
    {
        key: "payout_failed",
        name: "Payout failed in-app",
        type: "transactional",
        channel: "in_app",
        locale: "en",
        editable: true,
        subject: "Payout failed — {{amountFormatted}}",
        content: "{{failureReason}} Amount returned to your wallet.",
        variables: [
            "vendorName",
            "amountFormatted",
            "amountPaise",
            "payoutRequestId",
            "payoutDestination",
            "failureReason",
        ],
    },
];

const WHATSAPP_MIRROR_KEYS = new Set([
    "login_otp",
    "booking_confirmed",
    "booking_assigned",
    "vendor_en_route",
    "vendor_on_site",
    "delivery_code",
    "booking_completed",
    "vendor_new_job",
    "vendor_job_assigned",
    "booking_reminder",
    "payout_paid",
    "payout_failed",
]);

export const NOTIFICATION_TEMPLATE_SEEDS_WITH_WHATSAPP: NotificationTemplateSeed[] = [
    ...NOTIFICATION_TEMPLATE_SEEDS,
    ...NOTIFICATION_TEMPLATE_SEEDS.filter(
        (seed) => seed.channel === "sms" && WHATSAPP_MIRROR_KEYS.has(seed.key),
    ).map((seed) => ({
        ...seed,
        channel: "whatsapp" as NotificationChannel,
        name: seed.name.replace(/ SMS$/, " WhatsApp").replace(/^Login OTP$/, "Login OTP WhatsApp"),
    })),
];

export type SeedResult = {
    created: number;
    skipped: number;
    total: number;
};

function sqlLiteral(value: string | null): string {
    if (value === null) return "NULL";
    return `'${value.replace(/'/g, "''")}'`;
}

function sqlJsonArray(values: string[]): string {
    return `'${JSON.stringify(values)}'::jsonb`;
}

/** Render idempotent SQL from the same seed data (for migrations or manual runs). */
export function renderNotificationTemplatesSql(
    seeds = NOTIFICATION_TEMPLATE_SEEDS_WITH_WHATSAPP,
): string {
    const blocks = seeds.map((seed) => {
        const comment = `-- ${seed.key} / ${seed.channel}`;
        return `
  ${comment}
  INSERT INTO notification_templates (key, name, type, channel, locale, editable, is_active)
  VALUES (${sqlLiteral(seed.key)}, ${sqlLiteral(seed.name)}, ${sqlLiteral(seed.type)}, ${sqlLiteral(seed.channel)}, ${sqlLiteral(seed.locale)}, ${seed.editable}, true)
  ON CONFLICT (key, channel, locale) DO NOTHING;

  SELECT id INTO tid FROM notification_templates
  WHERE key = ${sqlLiteral(seed.key)} AND channel = ${sqlLiteral(seed.channel)} AND locale = ${sqlLiteral(seed.locale)};

  IF NOT EXISTS (SELECT 1 FROM notification_template_versions WHERE template_id = tid) THEN
    INSERT INTO notification_template_versions (template_id, version, subject, content, variables, is_active)
    VALUES (
      tid, 1,
      ${sqlLiteral(seed.subject)},
      ${sqlLiteral(seed.content)},
      ${sqlJsonArray(seed.variables)},
      true
    );
  END IF;`;
    });

    return `-- Generated from notification-templates.seed.ts
-- Idempotent: safe to re-run; skips rows that already exist

DO $$
DECLARE
  tid uuid;
BEGIN
${blocks.join("\n")}
END $$;
`;
}

/** Upsert default templates into Postgres. Skips templates that already have a version. */
export async function seedNotificationTemplates(
    db: NodePgDatabase<Record<string, never>>,
    seeds = NOTIFICATION_TEMPLATE_SEEDS_WITH_WHATSAPP,
): Promise<SeedResult> {
    let created = 0;
    let skipped = 0;

    for (const seed of seeds) {
        await db
            .insert(notificationTemplates)
            .values({
                key: seed.key,
                name: seed.name,
                type: seed.type,
                channel: seed.channel,
                locale: seed.locale,
                editable: seed.editable,
                isActive: true,
            })
            .onConflictDoNothing({
                target: [
                    notificationTemplates.key,
                    notificationTemplates.channel,
                    notificationTemplates.locale,
                ],
            });

        const [template] = await db
            .select({ id: notificationTemplates.id })
            .from(notificationTemplates)
            .where(
                and(
                    eq(notificationTemplates.key, seed.key),
                    eq(notificationTemplates.channel, seed.channel),
                    eq(notificationTemplates.locale, seed.locale),
                ),
            )
            .limit(1);

        if (!template) {
            throw new Error(`failed to resolve template ${seed.key}/${seed.channel}`);
        }

        const [existingVersion] = await db
            .select({ id: notificationTemplateVersions.id })
            .from(notificationTemplateVersions)
            .where(eq(notificationTemplateVersions.templateId, template.id))
            .limit(1);

        if (existingVersion) {
            skipped += 1;
            continue;
        }

        await db.insert(notificationTemplateVersions).values({
            templateId: template.id,
            version: 1,
            subject: seed.subject,
            content: seed.content,
            variables: seed.variables,
            isActive: true,
        });
        created += 1;
    }

    return { created, skipped, total: seeds.length };
}
