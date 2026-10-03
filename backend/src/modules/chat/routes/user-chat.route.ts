import { Router } from "express";
import type { UserChatController } from "@/modules/chat/controllers/user-chat.controller.js";
import {
    chatAttachmentUploadParamsDto,
    presignChatAttachmentDto,
} from "@/modules/chat/attachments/chat-attachment.dto.js";
import {
    conversationIdParamsDto,
    createComplaintDto,
    openSupportDto,
    listConversationsQueryDto,
    listMessagesQueryDto,
    markReadDto,
    orderIdParamsDto,
    sendMessageDto,
} from "@/modules/chat/chat.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/requireRole.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createUserChatRouter(controller: UserChatController) {
    const router = Router();
    router.use(authRequired, requireRole("user"));

    router.get(
        "/conversations",
        validate(listConversationsQueryDto, "query"),
        controller.listConversations,
    );
    router.post("/support", validate(openSupportDto), controller.openSupport);
    router.post("/complaints", validate(createComplaintDto), controller.createComplaint);
    router.get(
        "/orders/:orderId/conversation",
        validate(orderIdParamsDto, "params"),
        controller.getBookingConversation,
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

    return router;
}
