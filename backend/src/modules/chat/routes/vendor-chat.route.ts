import { Router } from "express";
import type { VendorChatController } from "@/modules/chat/controllers/vendor-chat.controller.js";
import {
    chatAttachmentUploadParamsDto,
    presignChatAttachmentDto,
} from "@/modules/chat/attachments/chat-attachment.dto.js";
import {
    conversationIdParamsDto,
    listConversationsQueryDto,
    listMessagesQueryDto,
    markReadDto,
    orderIdParamsDto,
    sendMessageDto,
} from "@/modules/chat/chat.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import {
    attachPartnerContext,
    requirePartnerRole,
} from "@/shared/middlewares/partner.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createVendorChatRouter(controller: VendorChatController) {
    const router = Router();
    router.use(authRequired, requirePartnerRole, attachPartnerContext);

    router.get(
        "/conversations",
        validate(listConversationsQueryDto, "query"),
        controller.listConversations,
    );
    router.post("/conversations/support", controller.openSupport);
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
    router.get(
        "/orders/:orderId/conversation",
        validate(orderIdParamsDto, "params"),
        controller.getBookingConversation,
    );

    return router;
}
