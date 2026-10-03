import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IConversationService } from "@/modules/chat/services/conversation.service.js";
import type { IChatAttachmentService } from "@/modules/chat/attachments/chat-attachment.service.js";
import type { IMessageService } from "@/modules/chat/services/message.service.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

export class VendorChatController {
    constructor(
        private readonly conversations: IConversationService,
        private readonly messages: IMessageService,
        private readonly attachments: IChatAttachmentService,
    ) {}

    listConversations = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        const data = await this.conversations.listForActor(userId, role, req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    openSupport = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        if (req.actor?.role === "vendor_staff") {
            throw ApiError.forbidden("support chat is for shop owners");
        }
        const data = await this.conversations.openVendorSupport(userId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getConversation = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        const data = await this.conversations.getForActor(userId, role, paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getBookingConversation = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const orderId = paramOrderId(req);
        const role = chatActorRole(req);
        const data = await this.conversations.getBookingByOrderId(userId, role, orderId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listMessages = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        const data = await this.messages.listMessages(userId, role, paramId(req), req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    presignAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        const data = await this.attachments.presign(userId, role, paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    completeAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const uploadId = paramUploadId(req);
        const role = chatActorRole(req);
        const data = await this.attachments.complete(userId, role, paramId(req), uploadId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    sendMessage = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        const data = await this.messages.sendMessage(userId, role, paramId(req), req.body);
        res.status(201).json(new ApiResponse(201, data, "message sent"));
    });

    markRead = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const role = chatActorRole(req);
        await this.messages.markRead(userId, role, paramId(req), req.body.lastReadMessageId);
        res.status(200).json(new ApiResponse(200, { ok: true }, "ok"));
    });
}

function chatActorRole(req: Request): UserRole {
    if (req.actor?.role === "vendor_staff") return "vendor_staff";
    return "vendor";
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

function paramOrderId(req: Request): string {
    const id = Array.isArray(req.params.orderId) ? req.params.orderId[0] : req.params.orderId;
    return String(id ?? "");
}

function paramUploadId(req: Request): string {
    const id = Array.isArray(req.params.uploadId) ? req.params.uploadId[0] : req.params.uploadId;
    return String(id ?? "");
}
