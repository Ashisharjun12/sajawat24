import type { Socket } from "socket.io";
import type { AppState } from "@/infrastructure/realtime/session-context.store.js";
import { sessionContextStore } from "@/infrastructure/realtime/session-context.store.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { OrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { ConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import { ParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import {
    APP_STATE_EVENT,
    CHAT_BLUR_EVENT,
    CHAT_FOCUS_EVENT,
} from "@/modules/chat/lib/chat.events.js";
import { ChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import {
    TypingService,
    attachChatTypingHandler,
} from "@/modules/chat/services/typing.service.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";

let typingService: TypingService | null = null;

function getTypingService(): TypingService {
    if (!typingService) {
        const participants = new ParticipantRepository();
        typingService = new TypingService(
            new ConversationRepository(),
            participants,
            new ChatAclService(
                participants,
                new OrderRepository(),
                new AssignmentRepository(),
                new VendorRepository(),
                new OrderFieldAssignmentRepository(),
                new VendorMemberRepository(),
            ),
            RealtimeFactory.getProvider(),
        );
    }
    return typingService;
}

export function registerChatSocket(socket: Socket): void {
    const userId = socket.data.userId as string;

    attachChatTypingHandler(socket, getTypingService());

    socket.on(CHAT_FOCUS_EVENT, (payload: { conversationId?: string }) => {
        if (!payload?.conversationId) return;
        sessionContextStore.setContext(userId, {
            activeConversationId: payload.conversationId,
        });
    });

    socket.on(CHAT_BLUR_EVENT, () => {
        sessionContextStore.setContext(userId, { activeConversationId: null });
    });

    socket.on(APP_STATE_EVENT, (payload: { state?: AppState }) => {
        if (payload?.state !== "foreground" && payload?.state !== "background") return;
        sessionContextStore.setContext(userId, { appState: payload.state });
    });
}
