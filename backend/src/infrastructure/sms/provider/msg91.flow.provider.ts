import { _config } from "@/config/config.js";
import {
    buildMsg91FlowRecipientVars,
    resolveMsg91Flow,
} from "@/infrastructure/sms/msg91.flow-map.js";
import { assertMsg91Configured, msg91MobileFromE164 } from "@/infrastructure/sms/msg91.template-map.js";
import { logger } from "@/utils/logger.js";

export type Msg91FlowSendInput = {
    to: string;
    event?: string;
    eventData?: Record<string, string>;
};

type Msg91FlowResponse = {
    type?: string;
    message?: string;
    request_id?: string;
};

export async function sendMsg91Flow(input: Msg91FlowSendInput): Promise<void> {
    assertMsg91Configured();

    const route = resolveMsg91Flow(input.event, input.eventData);
    if (!route) {
        throw new Error(
            `MSG91 Flow: no flow configured for event="${input.event ?? "unknown"}". Set MSG91_FLOW_* in .env (see docs/message-service.md)`,
        );
    }

    const mobiles = msg91MobileFromE164(input.to);
    const varFields = buildMsg91FlowRecipientVars(route.variableKeys, input.eventData ?? {});

    const payload: Record<string, unknown> = {
        flow_id: route.flowId,
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

    const url = _config.MSG91.flowApiUrl.replace(/\/?$/, "/");
    const authKey = _config.MSG91_AUTH_KEY!.trim();

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            authkey: authKey,
        },
        body: JSON.stringify(payload),
    });

    const text = await response.text();
    let parsed: Msg91FlowResponse | null = null;
    try {
        parsed = JSON.parse(text) as Msg91FlowResponse;
    } catch {
        /* plain text error */
    }

    if (!response.ok) {
        throw new Error(
            `MSG91 Flow HTTP ${response.status}: ${parsed?.message ?? text.slice(0, 300)}`,
        );
    }

    if (parsed?.type && parsed.type.toLowerCase() !== "success") {
        throw new Error(`MSG91 Flow send failed: ${parsed.message ?? text.slice(0, 300)}`);
    }

    logger.info(
        { to: mobiles, event: input.event, flowId: route.flowId, requestId: parsed?.request_id },
        "MSG91 Flow sent",
    );
}
