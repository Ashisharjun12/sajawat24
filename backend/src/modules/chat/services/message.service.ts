import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import type { IDeliveryRouter } from "@/modules/notifications/delivery/delivery-router.service.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import type { Conversation } from "@/modules/chat/conversations/conversation.schema.js";
import type { IConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import type { IMessageRepository } from "@/modules/chat/messages/message.repository.js";
import type { IParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import type { IChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import type { IConversationService } from "@/modules/chat/services/conversation.service.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";
import {
    CHAT_DEFAULT_MESSAGE_LIMIT,
    CHAT_MAX_BODY_LENGTH,
    CHAT_PREVIEW_LENGTH,
    CHAT_RATE_LIMIT_PER_MINUTE,
} from "@/modules/chat/lib/chat.constants.js";
import { CHAT_MESSAGE_EVENT, CHAT_READ_EVENT } from "@/modules/chat/lib/chat.events.js";
import { checkRateLimit } from "@/modules/chat/lib/rate-limit.js";
import type { Message } from "@/modules/chat/conversations/conversation.schema.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import type { IMediaService } from "@/modules/upload/media/media.service.js";

export type ReadStatus = "sent" | "read";

export type MessageView = {
    id: string;
    conversationId: string;
    sequence: number;
    senderUserId: string | null;
    senderRole: string;
    body: string | null;
    messageType: string;
    attachmentUrl: string | null;
    clientMessageId: string | null;
    createdAt: string;
    readStatus?: ReadStatus;
};

export interface IMessageService {
    listMessages(
        userId: string,
        role: UserRole,
        conversationId: string,
        query: { afterSequence?: number; beforeSequence?: number; limit?: number },
    ): Promise<MessageView[]>;
    sendMessage(
        userId: string,
        role: UserRole,
        conversationId: string,
        input: {
            body?: string;
            clientMessageId?: string;
            uploadId?: string;
            messageType?: "text" | "image" | "file";
        },
    ): Promise<MessageView>;
    markRead(
        userId: string,
        role: UserRole,
        conversationId: string,
        lastReadMessageId: string,
    ): Promise<void>;
}

export class MessageService implements IMessageService {
    constructor(
        private readonly conversations: IConversationRepository,
        private readonly messages: IMessageRepository,
        private readonly participants: IParticipantRepository,
        private readonly acl: IChatAclService,
        private readonly conversationService: IConversationService,
        private readonly users: IUserRepository,
        private readonly orders: IOrderRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly vendors: IVendorRepository,
        private readonly fieldAssignments: IOrderFieldAssignmentRepository,
        private readonly notifications: INotificationService,
        private readonly realtime: RealtimePort,
        private readonly deliveryRouter: IDeliveryRouter,
        private readonly media: IMediaService,
    ) {}

    async listMessages(
        userId: string,
        role: UserRole,
        conversationId: string,
        query: { afterSequence?: number; beforeSequence?: number; limit?: number },
    ): Promise<MessageView[]> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.acl.assertCanRead(userId, role, conversation);

        const limit = Math.min(query.limit ?? CHAT_DEFAULT_MESSAGE_LIMIT, 100);
        const rows = await this.messages.list(conversationId, {
            afterSequence: query.afterSequence,
            beforeSequence: query.beforeSequence,
            limit,
        });

        const maxReadSequence = await this.maxReadSequenceByOthers(conversationId, userId);
        return rows.map((row) => toMessageView(row, userId, maxReadSequence));
    }

    async sendMessage(
        userId: string,
        role: UserRole,
        conversationId: string,
        input: {
            body?: string;
            clientMessageId?: string;
            uploadId?: string;
            messageType?: "text" | "image" | "file";
        },
    ): Promise<MessageView> {
        const body = input.body?.trim() ?? "";
        if (!body && !input.uploadId) {
            throw ApiError.badRequest("message body or attachment required");
        }
        if (body.length > CHAT_MAX_BODY_LENGTH) {
            throw ApiError.badRequest(`message exceeds ${CHAT_MAX_BODY_LENGTH} characters`);
        }

        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");

        if (input.clientMessageId) {
            const existing = await this.messages.findByClientMessageId(
                conversationId,
                input.clientMessageId,
            );
            if (existing) {
                const maxReadSequence = await this.maxReadSequenceByOthers(conversationId, userId);
                return toMessageView(existing, userId, maxReadSequence);
            }
        }

        const rateKey = `chat:${userId}:${conversationId}`;
        if (!checkRateLimit(rateKey, CHAT_RATE_LIMIT_PER_MINUTE)) {
            throw new ApiError(429, "message rate limit exceeded");
        }

        if (role === "admin") {
            await this.conversationService.ensureAdminParticipant(userId, conversationId);
        }

        const reopenableTypes = new Set<Conversation["type"]>([
            "customer_support",
            "vendor_support",
            "complaint",
        ]);
        if (conversation.status === "closed" && reopenableTypes.has(conversation.type)) {
            await this.conversations.reopen(conversationId);
        }

        await this.acl.assertCanSend(userId, role, conversation);
        const senderRole = await this.acl.resolveSenderRole(userId, role, conversation);

        let attachmentUrl: string | null = null;
        let messageType: Message["messageType"] = input.messageType ?? "text";

        if (input.uploadId) {
            const upload = await this.media.getCompleted(input.uploadId);
            if (upload.uploadedBy !== userId) {
                throw ApiError.forbidden("upload does not belong to user");
            }
            if (!upload.key.startsWith(`chat/${conversationId}/`)) {
                throw ApiError.badRequest("upload does not belong to conversation");
            }
            attachmentUrl = displayUrl(upload);
            messageType =
                upload.kind === "file"
                    ? "file"
                    : upload.mimeType.startsWith("image/")
                      ? "image"
                      : "file";
        }

        const previewText =
            body ||
            (messageType === "image" ? "Photo" : uploadFilenameFromKey(attachmentUrl) || "Attachment");

        const message = await db.transaction(async (tx) => {
            const sequence = await this.messages.nextSequence(conversationId, tx);
            const row = await this.messages.insert(
                {
                    conversationId,
                    senderUserId: userId,
                    senderRole,
                    body: body || null,
                    messageType,
                    attachmentUrl,
                    clientMessageId: input.clientMessageId ?? null,
                },
                sequence,
                tx,
            );

            const preview = previewText.slice(0, CHAT_PREVIEW_LENGTH);
            const now = new Date();
            await this.conversations.updateAfterMessage(conversationId, preview, now, tx);
            await this.participants.incrementUnreadForOthers(conversationId, userId, tx);

            return row;
        });

        const maxReadSequence = await this.maxReadSequenceByOthers(conversationId, userId);
        const view = toMessageView(message, userId, maxReadSequence);
        await this.publishAndNotify(conversation, message, userId);

        return view;
    }

    async markRead(
        userId: string,
        role: UserRole,
        conversationId: string,
        lastReadMessageId: string,
    ): Promise<void> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.acl.assertCanRead(userId, role, conversation);

        const msg = await this.messages.findById(lastReadMessageId);
        if (!msg || msg.conversationId !== conversationId) {
            throw ApiError.badRequest("invalid message id");
        }

        await this.participants.markRead(conversationId, userId, lastReadMessageId, new Date());

        const participants = await this.participants.listByConversation(conversationId);
        for (const p of participants) {
            if (p.userId === userId) continue;
            await this.realtime.publish({
                userId: p.userId,
                event: CHAT_READ_EVENT,
                payload: {
                    conversationId,
                    readerUserId: userId,
                    lastReadMessageId,
                    readUpToSequence: msg.sequence,
                },
            });
        }
    }

    private async maxReadSequenceByOthers(
        conversationId: string,
        actorUserId: string,
    ): Promise<number> {
        const participants = await this.participants.listByConversation(conversationId);
        let max = 0;
        for (const p of participants) {
            if (p.userId === actorUserId || !p.lastReadMessageId) continue;
            const readMsg = await this.messages.findById(p.lastReadMessageId);
            if (readMsg && readMsg.sequence > max) max = readMsg.sequence;
        }
        return max;
    }

    private async publishAndNotify(
        conversation: Conversation,
        message: Message,
        senderUserId: string,
    ): Promise<void> {
        const participants = await this.participants.listByConversation(conversation.id);
        const sender = await this.users.findById(senderUserId);
        const preview = (message.body ?? "Attachment").slice(0, CHAT_PREVIEW_LENGTH);

        let orderRef = "";
        let orderId = "";
        if (conversation.contextType === "order" && conversation.contextId) {
            const order = await this.orders.findById(conversation.contextId);
            orderRef = order?.reference ?? "";
            orderId = conversation.contextId;
        }

        for (const p of participants) {
            if (p.userId === senderUserId) continue;

            if (
                conversation.type === "booking" &&
                conversation.contextId &&
                (await this.shouldSkipBookingChatNotify(p.userId, conversation.contextId))
            ) {
                continue;
            }

            await this.realtime.publish({
                userId: p.userId,
                event: CHAT_MESSAGE_EVENT,
                payload: {
                    conversationId: conversation.id,
                    message: toMessageView(message),
                },
            });

            const plan = this.deliveryRouter.resolveChatMessageDelivery(
                p.userId,
                conversation.id,
            );
            if (plan === "none") continue;

            try {
                await this.notifications.notify({
                    event: "CHAT_MESSAGE",
                    userId: p.userId,
                    channels: plan === "in_app" ? ["in_app"] : ["push"],
                    data: {
                        event: "CHAT_MESSAGE",
                        senderName: sender?.name ?? "Someone",
                        preview,
                        conversationId: conversation.id,
                        conversationType: conversation.type,
                        orderId,
                        orderRef,
                    },
                    idempotencyKey: `chat:${message.id}:${p.userId}`,
                });
            } catch {
                // non-blocking
            }
        }
    }

    private async shouldSkipBookingChatNotify(
        recipientUserId: string,
        orderId: string,
    ): Promise<boolean> {
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment) return false;

        const vendor = await this.vendors.findById(assignment.vendorId);
        if (!vendor || recipientUserId !== vendor.userId) return false;

        const fieldRows = await this.fieldAssignments.listForOrder(assignment.vendorId, orderId);
        const workerUserId = fieldRows[0]?.userId;
        return Boolean(workerUserId && workerUserId !== vendor.userId);
    }
}

function uploadFilenameFromKey(url: string | null): string | null {
    if (!url) return null;
    const segment = url.split("/").pop();
    if (!segment) return null;
    const dash = segment.indexOf("-");
    return dash >= 0 ? segment.slice(dash + 1) : segment;
}

function toMessageView(
    message: Message,
    actorUserId?: string,
    maxReadSequenceByOthers = 0,
): MessageView {
    const view: MessageView = {
        id: message.id,
        conversationId: message.conversationId,
        sequence: message.sequence,
        senderUserId: message.senderUserId,
        senderRole: message.senderRole,
        body: message.body,
        messageType: message.messageType,
        attachmentUrl: message.attachmentUrl,
        clientMessageId: message.clientMessageId,
        createdAt: message.createdAt.toISOString(),
    };

    if (actorUserId && message.senderUserId === actorUserId && message.messageType !== "system") {
        view.readStatus =
            message.sequence <= maxReadSequenceByOthers ? "read" : "sent";
    }

    return view;
}
