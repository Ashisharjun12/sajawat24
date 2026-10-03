import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type {
    Conversation,
    ConversationStatus,
    ConversationType,
} from "@/modules/chat/conversations/conversation.schema.js";
import type { IConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import type { IParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import type { IChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";
import type { IMessageRepository } from "@/modules/chat/messages/message.repository.js";
import { presenceStore } from "@/infrastructure/realtime/presence.store.js";
import { resolveServiceContact } from "@/modules/booking/lib/resolve-service-contact.js";

export type ChatPeerView = {
    name: string;
    phone: string | null;
    kind: "shop" | "worker";
};

export type ConversationView = {
    id: string;
    type: ConversationType;
    status: ConversationStatus;
    subject: string | null;
    topicKey: string | null;
    contextType: Conversation["contextType"];
    contextId: string | null;
    lastMessageAt: string | null;
    lastMessagePreview: string | null;
    unreadCount: number;
    participants: Array<{ userId: string; role: string; name: string; isOnline: boolean }>;
    orderRef?: string | null;
    assignedAdminId?: string | null;
    chatPeer?: ChatPeerView | null;
};

export interface IConversationService {
    getForActor(userId: string, role: UserRole, conversationId: string): Promise<ConversationView>;
    listForActor(
        userId: string,
        role: UserRole,
        query: {
            type?: ConversationType;
            status?: ConversationStatus | "all";
            unread?: boolean;
            q?: string;
            from?: string;
            to?: string;
            page: number;
            limit: number;
            assigned?: "mine" | "unassigned" | "all";
        },
    ): Promise<{ items: ConversationView[]; total: number; page: number; limit: number }>;
    openVendorSupport(vendorUserId: string): Promise<ConversationView>;
    openCustomerSupport(
        customerUserId: string,
        input?: { topicKey?: string; subject?: string },
    ): Promise<ConversationView>;
    openComplaint(
        customerUserId: string,
        input: { orderId: string; subject?: string; body?: string },
    ): Promise<ConversationView>;
    assignToAdmin(adminUserId: string, conversationId: string): Promise<ConversationView>;
    getBookingByOrderId(
        userId: string,
        role: UserRole,
        orderId: string,
    ): Promise<ConversationView>;
    close(adminUserId: string, conversationId: string, resolutionNote?: string): Promise<ConversationView>;
    reopen(adminUserId: string, conversationId: string): Promise<ConversationView>;
    ensureAdminParticipant(adminUserId: string, conversationId: string): Promise<void>;
    unreadCountForUser(userId: string): Promise<number>;
}

export class ConversationService implements IConversationService {
    constructor(
        private readonly conversations: IConversationRepository,
        private readonly participants: IParticipantRepository,
        private readonly messages: IMessageRepository,
        private readonly acl: IChatAclService,
        private readonly users: IUserRepository,
        private readonly vendors: IVendorRepository,
        private readonly orders: IOrderRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly fieldAssignments: IOrderFieldAssignmentRepository,
    ) {}

    async getForActor(userId: string, role: UserRole, conversationId: string): Promise<ConversationView> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.acl.assertCanRead(userId, role, conversation);
        return this.toView(conversation, userId, role);
    }

    async listForActor(
        userId: string,
        role: UserRole,
        query: {
            type?: ConversationType;
            status?: ConversationStatus | "all";
            unread?: boolean;
            q?: string;
            from?: string;
            to?: string;
            page: number;
            limit: number;
            assigned?: "mine" | "unassigned" | "all";
        },
    ): Promise<{ items: ConversationView[]; total: number; page: number; limit: number }> {
        const from = query.from ? new Date(query.from) : undefined;
        const to = query.to ? new Date(query.to) : undefined;

        if (role === "admin") {
            const { items, total } = await this.conversations.listForAdmin({
                type: query.type,
                status: query.status ?? "open",
                unread: query.unread,
                q: query.q,
                from,
                to,
                page: query.page,
                limit: query.limit,
                adminUserId: userId,
                assigned: query.assigned,
            });
            return {
                items: await Promise.all(items.map((c) => this.toView(c, userId, role))),
                total,
                page: query.page,
                limit: query.limit,
            };
        }

        const { items, total } = await this.conversations.listForParticipant({
            userId,
            type: query.type,
            status: query.status,
            unread: query.unread,
            q: query.q,
            from,
            to,
            page: query.page,
            limit: query.limit,
        });

        return {
            items: await Promise.all(items.map((c) => this.toView(c, userId, role))),
            total,
            page: query.page,
            limit: query.limit,
        };
    }

    async openVendorSupport(vendorUserId: string): Promise<ConversationView> {
        const vendor = await this.vendors.findByUserId(vendorUserId);
        if (!vendor) throw ApiError.forbidden("vendor profile required");

        const existing = await this.conversations.findByTypeAndContext(
            "vendor_support",
            "vendor",
            vendor.id,
        );
        if (existing) {
            await this.participants.upsertParticipant({
                conversationId: existing.id,
                userId: vendorUserId,
                role: "vendor",
            });
            return this.toView(existing, vendorUserId, "vendor");
        }

        const conversation = await db.transaction(async (tx) => {
            const created = await this.conversations.create(
                {
                    type: "vendor_support",
                    status: "open",
                    subject: "Partner support",
                    contextType: "vendor",
                    contextId: vendor.id,
                },
                tx,
            );
            await this.participants.upsertParticipant(
                { conversationId: created.id, userId: vendorUserId, role: "vendor" },
                tx,
            );
            return created;
        });

        return this.toView(conversation, vendorUserId, "vendor");
    }

    async openCustomerSupport(
        customerUserId: string,
        input?: { topicKey?: string; subject?: string },
    ): Promise<ConversationView> {
        const topicKey = input?.topicKey?.trim() || "general";
        const subject = input?.subject?.trim() || "Customer support";

        const existing = await this.conversations.findBySupportTopic(
            customerUserId,
            topicKey,
            subject,
        );
        if (existing) {
            const resumed = await this.resumeCustomerSupportConversation(
                customerUserId,
                existing,
            );
            return this.toView(resumed, customerUserId, "user");
        }

        const conversation = await db.transaction(async (tx) => {
            const again = await this.conversations.findBySupportTopic(
                customerUserId,
                topicKey,
                subject,
            );
            if (again) {
                return this.resumeCustomerSupportConversation(customerUserId, again, tx);
            }

            const created = await this.conversations.create(
                {
                    type: "customer_support",
                    status: "open",
                    subject,
                    topicKey,
                    contextType: "none",
                    contextId: customerUserId,
                },
                tx,
            );
            await this.participants.upsertParticipant(
                { conversationId: created.id, userId: customerUserId, role: "customer" },
                tx,
            );
            const seq = await this.messages.nextSequence(created.id, tx);
            await this.messages.insert(
                {
                    conversationId: created.id,
                    senderUserId: null,
                    senderRole: "system",
                    body: `Support chat opened: ${subject}`,
                    messageType: "system",
                },
                seq,
                tx,
            );
            return created;
        });

        return this.toView(conversation, customerUserId, "user");
    }

    async openComplaint(
        customerUserId: string,
        input: { orderId: string; subject?: string; body?: string },
    ): Promise<ConversationView> {
        const order = await this.orders.findById(input.orderId);
        if (!order) throw ApiError.notFound("order not found");
        if (order.userId !== customerUserId) throw ApiError.forbidden("not your order");

        const existing = await this.conversations.findByTypeAndContext(
            "complaint",
            "order",
            input.orderId,
        );
        if (existing) {
            await this.participants.upsertParticipant({
                conversationId: existing.id,
                userId: customerUserId,
                role: "customer",
            });
            return this.toView(existing, customerUserId, "user");
        }

        const subject = input.subject?.trim() || `Complaint — ${order.reference}`;
        const conversation = await db.transaction(async (tx) => {
            const created = await this.conversations.create(
                {
                    type: "complaint",
                    status: "open",
                    subject,
                    contextType: "order",
                    contextId: input.orderId,
                },
                tx,
            );
            await this.participants.upsertParticipant(
                { conversationId: created.id, userId: customerUserId, role: "customer" },
                tx,
            );
            const seq1 = await this.messages.nextSequence(created.id, tx);
            await this.messages.insert(
                {
                    conversationId: created.id,
                    senderUserId: null,
                    senderRole: "system",
                    body: `Complaint opened for order ${order.reference}`,
                    messageType: "system",
                },
                seq1,
                tx,
            );
            if (input.body?.trim()) {
                const seq2 = await this.messages.nextSequence(created.id, tx);
                await this.messages.insert(
                    {
                        conversationId: created.id,
                        senderUserId: customerUserId,
                        senderRole: "customer",
                        body: input.body.trim(),
                        messageType: "text",
                    },
                    seq2,
                    tx,
                );
            }
            return created;
        });

        return this.toView(conversation, customerUserId, "user");
    }

    async assignToAdmin(adminUserId: string, conversationId: string): Promise<ConversationView> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.ensureAdminParticipant(adminUserId, conversationId);
        const updated = await this.conversations.assignAdmin(conversationId, adminUserId);
        if (!updated) throw ApiError.conflict("could not assign conversation");
        return this.toView(updated, adminUserId, "admin");
    }

    async getBookingByOrderId(
        userId: string,
        role: UserRole,
        orderId: string,
    ): Promise<ConversationView> {
        const conversation = await this.conversations.findByTypeAndContext("booking", "order", orderId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.acl.assertCanRead(userId, role, conversation);
        return this.toView(conversation, userId, role);
    }

    async close(
        adminUserId: string,
        conversationId: string,
        resolutionNote?: string,
    ): Promise<ConversationView> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");

        await this.ensureAdminParticipant(adminUserId, conversationId);

        const updated = await db.transaction(async (tx) => {
            const closed = await this.conversations.close(
                conversationId,
                adminUserId,
                resolutionNote,
                tx,
            );
            const seq = await this.messages.nextSequence(conversationId, tx);
            await this.messages.insert(
                {
                    conversationId,
                    senderUserId: null,
                    senderRole: "system",
                    body: "Ticket closed by admin",
                    messageType: "system",
                },
                seq,
                tx,
            );
            return closed;
        });

        if (!updated) throw ApiError.conflict("could not close conversation");
        return this.toView(updated, adminUserId, "admin");
    }

    async reopen(adminUserId: string, conversationId: string): Promise<ConversationView> {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.ensureAdminParticipant(adminUserId, conversationId);

        const updated = await this.conversations.reopen(conversationId);
        if (!updated) throw ApiError.conflict("could not reopen conversation");
        return this.toView(updated, adminUserId, "admin");
    }

    async ensureAdminParticipant(adminUserId: string, conversationId: string): Promise<void> {
        await this.participants.upsertParticipant({
            conversationId,
            userId: adminUserId,
            role: "admin",
        });
    }

    private async resumeCustomerSupportConversation(
        customerUserId: string,
        existing: Conversation,
        tx?: Parameters<Parameters<typeof db.transaction>[0]>[0],
    ): Promise<Conversation> {
        const run = async (client: Parameters<Parameters<typeof db.transaction>[0]>[0]) => {
            await this.participants.upsertParticipant(
                {
                    conversationId: existing.id,
                    userId: customerUserId,
                    role: "customer",
                },
                client,
            );

            if (existing.status !== "closed") {
                return existing;
            }

            const reopened = await this.conversations.reopen(existing.id, client);
            if (!reopened) return existing;

            const seq = await this.messages.nextSequence(existing.id, client);
            await this.messages.insert(
                {
                    conversationId: existing.id,
                    senderUserId: null,
                    senderRole: "system",
                    body: "Chat reopened",
                    messageType: "system",
                },
                seq,
                client,
            );
            return reopened;
        };

        if (tx) {
            return run(tx);
        }

        return db.transaction(async (innerTx) => run(innerTx));
    }

    async unreadCountForUser(userId: string): Promise<number> {
        return this.participants.totalUnreadForUser(userId);
    }

    private async toView(
        conversation: Conversation & { unreadCount?: number },
        actorUserId: string,
        role: UserRole,
    ): Promise<ConversationView> {
        const parts = await this.participants.listByConversation(conversation.id);
        const participantViews = await Promise.all(
            parts.map(async (p) => {
                const user = await this.users.findById(p.userId);
                return {
                    userId: p.userId,
                    role: p.role,
                    name: user?.name ?? "User",
                    isOnline: presenceStore.isOnline(p.userId),
                };
            }),
        );

        const self = parts.find((p) => p.userId === actorUserId);
        let orderRef: string | null = null;
        if (conversation.contextType === "order" && conversation.contextId) {
            const order = await this.orders.findById(conversation.contextId);
            orderRef = order?.reference ?? null;
        }

        let chatPeer: ChatPeerView | null = null;
        if (
            role === "user" &&
            conversation.type === "booking" &&
            conversation.contextType === "order" &&
            conversation.contextId
        ) {
            chatPeer = await this.resolveBookingChatPeer(conversation.contextId);
        }

        return {
            id: conversation.id,
            type: conversation.type,
            status: conversation.status,
            subject: conversation.subject,
            topicKey: conversation.topicKey ?? null,
            contextType: conversation.contextType,
            contextId: conversation.contextId,
            lastMessageAt: conversation.lastMessageAt?.toISOString() ?? null,
            lastMessagePreview: conversation.lastMessagePreview,
            unreadCount: self?.unreadCount ?? conversation.unreadCount ?? 0,
            participants: participantViews,
            orderRef,
            assignedAdminId: conversation.assignedAdminId ?? null,
            chatPeer,
        };
    }

    private async resolveBookingChatPeer(orderId: string): Promise<ChatPeerView | null> {
        const order = await this.orders.findById(orderId);
        const contact = await resolveServiceContact(orderId, order?.status ?? "", {
            assignments: this.assignments,
            fieldAssignments: this.fieldAssignments,
            vendors: this.vendors,
            users: this.users,
        });
        if (!contact) return null;
        return {
            kind: contact.kind,
            name: contact.name,
            phone: contact.phone,
        };
    }
}
