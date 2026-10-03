import { ApiError } from "@/shared/errors/apiError.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { Conversation, ConversationType } from "@/modules/chat/conversations/conversation.schema.js";
import type { IParticipantRepository } from "@/modules/chat/participants/participant.repository.js";
import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import type { IVendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";
import {
    assignedFieldWorkerUserId,
    isDistinctFieldWorkerAssigned,
} from "@/modules/booking/lib/booking-field-chat.js";

const READ_ONLY_ORDER_STATUSES = new Set(["CANCELLED", "COMPLETED"]);

export interface IChatAclService {
    assertCanRead(userId: string, role: UserRole, conversation: Conversation): Promise<void>;
    assertCanSend(userId: string, role: UserRole, conversation: Conversation): Promise<void>;
    resolveSenderRole(userId: string, role: UserRole, conversation: Conversation): Promise<"customer" | "vendor" | "admin">;
    canAdminAccessType(type: ConversationType): boolean;
}

export class ChatAclService implements IChatAclService {
    constructor(
        private readonly participants: IParticipantRepository,
        private readonly orders: IOrderRepository,
        private readonly assignments: IAssignmentRepository,
        private readonly vendors: IVendorRepository,
        private readonly fieldAssignments: IOrderFieldAssignmentRepository,
        private readonly vendorMembers: IVendorMemberRepository,
    ) {}

    canAdminAccessType(type: ConversationType): boolean {
        return type === "vendor_support" || type === "customer_support" || type === "complaint";
    }

    async assertCanRead(userId: string, role: UserRole, conversation: Conversation): Promise<void> {
        if (role === "admin" && this.canAdminAccessType(conversation.type)) {
            return;
        }

        if (conversation.type === "booking" && conversation.contextId) {
            await this.assertBookingChatReadable(conversation.contextId, role);
            if (role === "vendor" || role === "vendor_staff") {
                await this.assertBookingChatAllowed(conversation.contextId, userId, role);
            }
        }

        const participant = await this.participants.findByConversationAndUser(conversation.id, userId);
        if (!participant) {
            throw ApiError.forbidden("not a participant in this conversation");
        }
    }

    async assertCanSend(userId: string, role: UserRole, conversation: Conversation): Promise<void> {
        if (conversation.status === "closed" && conversation.type === "booking") {
            throw ApiError.conflict("conversation is closed");
        }

        if (role === "admin") {
            if (!this.canAdminAccessType(conversation.type)) {
                throw ApiError.forbidden("admin cannot send in this conversation type");
            }
            return;
        }

        const participant = await this.participants.findByConversationAndUser(conversation.id, userId);
        if (!participant) {
            throw ApiError.forbidden("not a participant in this conversation");
        }

        if (conversation.type === "booking" && conversation.contextId) {
            await this.assertBookingChatAllowed(conversation.contextId, userId, role);
        }
    }

    async resolveSenderRole(
        userId: string,
        role: UserRole,
        conversation: Conversation,
    ): Promise<"customer" | "vendor" | "admin"> {
        if (role === "admin") return "admin";
        const participant = await this.participants.findByConversationAndUser(conversation.id, userId);
        if (participant?.role === "vendor") return "vendor";
        if (participant?.role === "customer") return "customer";
        if (role === "vendor" || role === "vendor_staff") return "vendor";
        return "customer";
    }

    private async assertBookingChatReadable(orderId: string, role: UserRole): Promise<void> {
        if (role === "admin") return;
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");
        if (READ_ONLY_ORDER_STATUSES.has(order.status)) {
            throw ApiError.forbidden("booking chat is no longer available");
        }
    }

    private async assertBookingChatAllowed(
        orderId: string,
        userId: string,
        role: UserRole,
    ): Promise<void> {
        const order = await this.orders.findById(orderId);
        if (!order) throw ApiError.notFound("order not found");
        if (READ_ONLY_ORDER_STATUSES.has(order.status)) {
            throw ApiError.conflict("chat is read-only for this order");
        }

        const assignment = await this.assignments.findActiveByOrderId(orderId);
        if (!assignment || assignment.vendorResponse !== "accepted") {
            throw ApiError.forbidden("chat is not available until vendor accepts");
        }

        if (role === "user" && order.userId !== userId) {
            throw ApiError.forbidden("not your order");
        }

        if (role === "vendor") {
            const vendor = await this.vendors.findByUserId(userId);
            if (!vendor || vendor.id !== assignment.vendorId) {
                throw ApiError.forbidden("not assigned to this order");
            }
            const workerUserId = await assignedFieldWorkerUserId(
                this.fieldAssignments,
                assignment.vendorId,
                orderId,
            );
            if (isDistinctFieldWorkerAssigned(vendor.userId, workerUserId)) {
                throw ApiError.forbidden("chat is with the assigned field worker for this job");
            }
            return;
        }

        if (role === "vendor_staff") {
            const member = await this.vendorMembers.findActiveByUserId(userId);
            if (!member || member.vendorId !== assignment.vendorId) {
                throw ApiError.forbidden("not assigned to this order");
            }
            const assigned = await this.fieldAssignments.isMemberAssigned(member.id, orderId);
            if (!assigned) {
                throw ApiError.forbidden("job not assigned to you");
            }
        }
    }
}
