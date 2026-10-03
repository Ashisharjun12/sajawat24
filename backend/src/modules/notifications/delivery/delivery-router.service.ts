import { sessionContextStore } from "@/infrastructure/realtime/session-context.store.js";

export type DeliveryPlan = "none" | "in_app" | "push";

export interface IDeliveryRouter {
    resolveChatMessageDelivery(recipientUserId: string, conversationId: string): DeliveryPlan;
}

export class DeliveryRouter implements IDeliveryRouter {
    resolveChatMessageDelivery(recipientUserId: string, conversationId: string): DeliveryPlan {
        const ctx = sessionContextStore.getContext(recipientUserId);

        if (
            ctx.connected &&
            ctx.appState === "foreground" &&
            ctx.activeConversationId === conversationId
        ) {
            return "none";
        }

        if (ctx.connected && ctx.appState === "foreground") {
            return "in_app";
        }

        return "push";
    }
}

export const deliveryRouter = new DeliveryRouter();
