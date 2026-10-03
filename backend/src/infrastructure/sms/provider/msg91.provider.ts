import { _config } from "@/config/config.js";
import type { ISmsProvider, SmsMessage } from "@/infrastructure/sms/sms.interface.js";
import {
    assertMsg91Configured,
    buildMsg91RecipientVars,
    msg91MobileFromE164,
    resolveMsg91Template,
} from "@/infrastructure/sms/msg91.template-map.js";
import { logger } from "@/utils/logger.js";

const MSG91_SEND_URL = "https://control.msg91.com/api/v5/sms/send";

type Msg91SendResponse = {
    type?: string;
    message?: string;
    request_id?: string;
};

export class Msg91SmsProvider implements ISmsProvider {
    constructor() {
        assertMsg91Configured();
    }

    async send(message: SmsMessage): Promise<void> {
        const event = message.meta?.event;
        const eventData = message.meta?.eventData ?? {};
        const route = resolveMsg91Template(event, eventData);

        if (!route) {
            throw new Error(
                `MSG91: no template configured for event="${event ?? "unknown"}". Set MSG91_TEMPLATE_* in .env (see docs/sms.md)`,
            );
        }

        const mobiles = msg91MobileFromE164(message.to);
        const varFields = buildMsg91RecipientVars(route.variableKeys, eventData);

        const payload: Record<string, unknown> = {
            template_id: route.templateId,
            short_url: "0",
            recipients: [
                {
                    mobiles,
                    ...varFields,
                },
            ],
        };

        const sender = _config.MSG91_SENDER_ID?.trim();
        if (sender) {
            payload.sender = sender;
        }

        const entityId = _config.MSG91_DLT_ENTITY_ID?.trim();
        if (entityId) {
            payload.DLT_TE_ID = entityId;
        }

        const routeType = _config.MSG91_ROUTE?.trim();
        if (routeType) {
            payload.route = routeType;
        }

        const authKey = _config.MSG91_AUTH_KEY!.trim();
        const response = await fetch(MSG91_SEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                authkey: authKey,
            },
            body: JSON.stringify(payload),
        });

        const text = await response.text();
        let parsed: Msg91SendResponse | null = null;
        try {
            parsed = JSON.parse(text) as Msg91SendResponse;
        } catch {
            /* plain text error */
        }

        if (!response.ok) {
            throw new Error(
                `MSG91 HTTP ${response.status}: ${parsed?.message ?? text.slice(0, 300)}`,
            );
        }

        if (parsed?.type && parsed.type.toLowerCase() !== "success") {
            throw new Error(`MSG91 send failed: ${parsed.message ?? text.slice(0, 300)}`);
        }

        logger.info(
            { to: mobiles, event, templateId: route.templateId, requestId: parsed?.request_id },
            "MSG91 SMS sent",
        );
    }
}
