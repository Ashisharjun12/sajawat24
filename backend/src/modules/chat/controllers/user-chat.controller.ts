import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IConversationService } from "@/modules/chat/services/conversation.service.js";
import type { IChatAttachmentService } from "@/modules/chat/attachments/chat-attachment.service.js";
import type { IMessageService } from "@/modules/chat/services/message.service.js";
import type { IBookingChatService } from "@/modules/chat/services/booking-chat.service.js";

export class UserChatController {
    constructor(
        private readonly conversations: IConversationService,
        private readonly messages: IMessageService,
        private readonly attachments: IChatAttachmentService,
        private readonly bookingChat: IBookingChatService,
    ) {}

    listConversations = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.listForActor(userId, "user", req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    openSupport = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.openCustomerSupport(userId, req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createComplaint = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.openComplaint(userId, req.body);
        res.status(201).json(new ApiResponse(201, data, "complaint opened"));
    });

    getBookingConversation = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const orderId = paramOrderId(req);
        let data;
        try {
            data = await this.conversations.getBookingByOrderId(userId, "user", orderId);
        } catch (err) {
            if (!(err instanceof ApiError && err.statusCode === 404)) {
                throw err;
            }
            await this.bookingChat.openBookingConversationForOrder(orderId);
            data = await this.conversations.getBookingByOrderId(userId, "user", orderId);
        }
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listMessages = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.messages.listMessages(userId, "user", paramId(req), req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    presignAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.attachments.presign(userId, "user", paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    completeAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const uploadId = paramUploadId(req);
        const data = await this.attachments.complete(userId, "user", paramId(req), uploadId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    sendMessage = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.messages.sendMessage(userId, "user", paramId(req), req.body);
        res.status(201).json(new ApiResponse(201, data, "message sent"));
    });

    markRead = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        await this.messages.markRead(userId, "user", paramId(req), req.body.lastReadMessageId);
        res.status(200).json(new ApiResponse(200, { ok: true }, "ok"));
    });
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
