import { db } from "@/db/postgres-client.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import type { Conversation } from "@/modules/chat/conversations/conversation.schema.js";
import type { IMessageRepository } from "@/modules/chat/messages/message.repository.js";
import type { IParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";

export type BookingChatCloseReason = "completed" | "cancelled";

export interface IBookingChatService {
    openBookingConversationForOrder(orderId: string): Promise<Conversation>;
    ensureBookingConversation(orderId: string): Promise<Conversation>;
    syncBookingFieldWorker(orderId: string, vendorId: string): Promise<void>;
    closeBookingConversation(
        orderId: string,
        reason?: BookingChatCloseReason,
    ): Promise<void>;
}

export class BookingChatService implements IBookingChatService {
    constructor(
        private readonly conversations: IConversationRepository,
        private readonly participants: IParticipantRepository,
        private readonly messages: IMessageRepository,
        private readonly orders: IOrderRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly vendors: IVendorRepository,
        private readonly fieldAssignments: IOrderFieldAssignmentRepository,
    ) {}

    /** Create conversation if missing and align vendor participant with field worker when assigned. */
    async openBookingConversationForOrder(orderId: string): Promise<Conversation> {
        const conversation = await this.ensureBookingConversation(orderId);
        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (assignment) {
            await this.syncBookingFieldWorker(orderId, assignment.vendorId);
        }
        return conversation;
    }

    async ensureBookingConversation(orderId: string): Promise<Conversation> {
        const existing = await this.conversations.findByTypeAndContext(
            "booking",
            "order",
            orderId,
        );
        if (existing) return existing;

        const order = await this.orders.findById(orderId);
        if (!order) throw new Error(`order not found: ${orderId}`);

        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorResponse !== "accepted") {
            throw new Error(`assignment not accepted for order: ${orderId}`);
        }

        const vendor = await this.vendors.findById(assignment.vendorId);
        if (!vendor) throw new Error(`vendor not found: ${assignment.vendorId}`);

        return db.transaction(async (tx) => {
            const again = await this.conversations.findByTypeAndContext("booking", "order", orderId);
            if (again) return again;

            const conversation = await this.conversations.create(
                {
                    type: "booking",
                    status: "open",
                    contextType: "order",
                    contextId: orderId,
                    subject: `Booking ${order.reference}`,
                },
                tx,
            );

            await this.participants.upsertParticipant(
                { conversationId: conversation.id, userId: order.userId, role: "customer" },
                tx,
            );
            await this.participants.upsertParticipant(
                { conversationId: conversation.id, userId: vendor.userId, role: "vendor" },
                tx,
            );

            return conversation;
        });
    }

    async syncBookingFieldWorker(orderId: string, vendorId: string): Promise<void> {
        const vendor = await this.vendors.findById(vendorId);
        if (!vendor) return;

        let conversation = await this.conversations.findByTypeAndContext("booking", "order", orderId);
        if (!conversation) {
            try {
                conversation = await this.ensureBookingConversation(orderId);
            } catch {
                return;
            }
        }

        const ownerUserId = vendor.userId;
        const fieldRows = await this.fieldAssignments.listForOrder(vendorId, orderId);
        const workerUserId = fieldRows[0]?.userId ?? null;
        const vendorChatUserId =
            workerUserId && workerUserId !== ownerUserId ? workerUserId : ownerUserId;

        const parts = await this.participants.listByConversation(conversation.id);
        for (const p of parts) {
            if (p.role === "vendor" && p.userId !== vendorChatUserId) {
                await this.participants.removeParticipant(conversation.id, p.userId);
            }
        }

        await this.participants.upsertParticipant({
            conversationId: conversation.id,
            userId: vendorChatUserId,
            role: "vendor",
        });
    }

    async closeBookingConversation(
        orderId: string,
        reason: BookingChatCloseReason = "completed",
    ): Promise<void> {
        const conversation = await this.conversations.findByTypeAndContext(
            "booking",
            "order",
            orderId,
        );
        if (!conversation || conversation.status === "closed") return;

        const body =
            reason === "cancelled"
                ? "Chat closed — booking cancelled"
                : "Chat closed — order completed";

        await db.transaction(async (tx) => {
            const closed = await this.conversations.closeSystem(conversation.id, null, tx);
            if (!closed) return;

            const seq = await this.messages.nextSequence(conversation.id, tx);
            await this.messages.insert(
                {
                    conversationId: conversation.id,
                    senderUserId: null,
                    senderRole: "system",
                    body,
                    messageType: "system",
                },
                seq,
                tx,
            );
        });
    }
}
