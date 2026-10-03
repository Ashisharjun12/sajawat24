import { Router } from "express";
import type { AdminChatController } from "@/modules/chat/controllers/admin-chat.controller.js";
import {
    chatAttachmentUploadParamsDto,
    presignChatAttachmentDto,
} from "@/modules/chat/attachments/chat-attachment.dto.js";
import {
    closeConversationDto,
    conversationIdParamsDto,
    listConversationsQueryDto,
    listMessagesQueryDto,
    markReadDto,
    sendMessageDto,
} from "@/modules/chat/chat.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createAdminChatRouter(controller: AdminChatController) {
    const router = Router();

    router.get("/unread-count", controller.unreadCount);
    router.get(
        "/conversations",
        validate(listConversationsQueryDto, "query"),
        controller.listConversations,
    );
    router.get(
        "/conversations/:id",
        validate(conversationIdParamsDto, "params"),
        controller.getConversation,
    );
    router.post(
        "/conversations/:id/attachments/presign",
        validate(conversationIdParamsDto, "params"),
        validate(presignChatAttachmentDto),
        controller.presignAttachment,
    );
    router.post(
        "/conversations/:id/attachments/:uploadId/complete",
        validate(chatAttachmentUploadParamsDto, "params"),
        controller.completeAttachment,
    );
    router.get(
        "/conversations/:id/messages",
        validate(conversationIdParamsDto, "params"),
        validate(listMessagesQueryDto, "query"),
        controller.listMessages,
    );
    router.post(
        "/conversations/:id/messages",
        validate(conversationIdParamsDto, "params"),
        validate(sendMessageDto),
        controller.sendMessage,
    );
    router.post(
        "/conversations/:id/read",
        validate(conversationIdParamsDto, "params"),
        validate(markReadDto),
        controller.markRead,
    );
    router.post(
        "/conversations/:id/close",
        validate(conversationIdParamsDto, "params"),
        validate(closeConversationDto),
        controller.close,
    );
    router.post(
        "/conversations/:id/reopen",
        validate(conversationIdParamsDto, "params"),
        controller.reopen,
    );
    router.post(
        "/conversations/:id/assign",
        validate(conversationIdParamsDto, "params"),
        controller.assign,
    );

    return router;
}
