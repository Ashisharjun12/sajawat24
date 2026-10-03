import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IChatAttachmentService } from "@/modules/chat/attachments/chat-attachment.service.js";
import type { IConversationService } from "@/modules/chat/services/conversation.service.js";
import type { IMessageService } from "@/modules/chat/services/message.service.js";

export class AdminChatController {
    constructor(
        private readonly conversations: IConversationService,
        private readonly messages: IMessageService,
        private readonly attachments: IChatAttachmentService,
    ) {}

    unreadCount = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const total = await this.conversations.unreadCountForUser(userId);
        res.status(200).json(new ApiResponse(200, { total }, "ok"));
    });

    listConversations = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.listForActor(userId, "admin", req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getConversation = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.getForActor(userId, "admin", paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listMessages = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.messages.listMessages(userId, "admin", paramId(req), req.query as never);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    presignAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.attachments.presign(userId, "admin", paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    completeAttachment = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const uploadId = paramUploadId(req);
        const data = await this.attachments.complete(userId, "admin", paramId(req), uploadId);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    sendMessage = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.messages.sendMessage(userId, "admin", paramId(req), req.body);
        res.status(201).json(new ApiResponse(201, data, "message sent"));
    });

    markRead = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        await this.messages.markRead(userId, "admin", paramId(req), req.body.lastReadMessageId);
        res.status(200).json(new ApiResponse(200, { ok: true }, "ok"));
    });

    close = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.close(userId, paramId(req), req.body.resolutionNote);
        res.status(200).json(new ApiResponse(200, data, "closed"));
    });

    reopen = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.reopen(userId, paramId(req));
        res.status(200).json(new ApiResponse(200, data, "reopened"));
    });

    assign = asyncHandler(async (req, res) => {
        const userId = req.actor?.id;
        if (!userId) throw ApiError.unauthorized();
        const data = await this.conversations.assignToAdmin(userId, paramId(req));
        res.status(200).json(new ApiResponse(200, data, "assigned"));
    });
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}

function paramUploadId(req: Request): string {
    const id = Array.isArray(req.params.uploadId) ? req.params.uploadId[0] : req.params.uploadId;
    return String(id ?? "");
}
