import type { Socket } from "socket.io";
import type { RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import type { IConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import type { IParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import { CHAT_TYPING_EVENT } from "@/modules/chat/lib/chat.events.js";
import type { IChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

export class TypingService {
    constructor(
        private readonly conversations: IConversationRepository,
        private readonly participants: IParticipantRepository,
        private readonly acl: IChatAclService,
        private readonly realtime: RealtimePort,
    ) {}

    async broadcastTyping(
        userId: string,
        role: UserRole,
        conversationId: string,
        isTyping: boolean,
    ): Promise<void> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) return;

        try {
            await this.acl.assertCanRead(userId, role, conversation);
        } catch {
            return;
        }

        const participant = await this.participants.findByConversationAndUser(conversationId, userId);
        const senderRole = participant?.role ?? role;

        const others = await this.participants.listByConversation(conversationId);
        for (const p of others) {
            if (p.userId === userId) continue;
            await this.realtime.publish({
                userId: p.userId,
                event: CHAT_TYPING_EVENT,
                payload: {
                    conversationId,
                    isTyping,
                    role: senderRole,
                    userId,
                },
            });
        }
    }
}

export function attachChatTypingHandler(
    socket: Socket,
    typingService: TypingService,
): void {
    socket.on(
        CHAT_TYPING_EVENT,
        async (payload: { conversationId?: string; isTyping?: boolean }) => {
            const userId = socket.data.userId as string | undefined;
            const role = socket.data.role as UserRole | undefined;
            const conversationId = payload?.conversationId;
            if (!userId || !role || !conversationId) return;

            await typingService.broadcastTyping(
                userId,
                role,
                conversationId,
                Boolean(payload.isTyping),
            );
        },
    );
}
