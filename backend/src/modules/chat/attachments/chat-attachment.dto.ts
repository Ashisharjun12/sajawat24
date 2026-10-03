import { z } from "zod";
import { conversationIdParamsDto } from "@/modules/chat/chat.dto.js";

export const presignChatAttachmentDto = z.object({
    fileName: z.string().min(1).max(255),
    mimeType: z.string().min(3).max(100),
    kind: z.enum(["image", "file"]),
});

export const chatAttachmentUploadParamsDto = conversationIdParamsDto.extend({
    uploadId: z.string().uuid(),
});

export type PresignChatAttachmentInput = z.infer<typeof presignChatAttachmentDto>;
