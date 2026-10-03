import { _config } from "@/config/config.js";
import type { NotificationEvent } from "@/modules/notifications/policy/events.js";
import { MSG91_EVENT_ROUTES } from "@/infrastructure/sms/msg91.event-routes.js";

export type Msg91FlowRoute = {
    flowId: string;
    /** Ordered keys read from eventData for Flow VAR1, VAR2, … */
    variableKeys: string[];
};

/**
 * Resolve MSG91 One API Flow + variable order for a notification event.
 */
export function resolveMsg91Flow(
    event: string | undefined,
    _eventData: Record<string, string> | undefined,
): Msg91FlowRoute | null {
    if (!event) return null;

    const spec = MSG91_EVENT_ROUTES[event as NotificationEvent];
    if (!spec) return null;

    const flowId = _config.MSG91.flows[spec.flowEnvKey];
    if (!flowId) return null;

    return { flowId, variableKeys: spec.variableKeys };
}

export function buildMsg91FlowRecipientVars(
    variableKeys: string[],
    eventData: Record<string, string>,
): Record<string, string> {
    const recipient: Record<string, string> = {};
    variableKeys.forEach((key, index) => {
        const varKey = `VAR${index + 1}`;
        recipient[varKey] = eventData[key] ?? "";
    });
    return recipient;
}
