import { z } from "zod";

export const conversationIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const orderIdParamsDto = z.object({
    orderId: z.string().uuid(),
});

export const listConversationsQueryDto = z.object({
    type: z.enum(["booking", "vendor_support", "customer_support", "complaint"]).optional(),
    assigned: z.enum(["mine", "unassigned", "all"]).optional(),
    status: z.enum(["open", "pending", "closed", "all"]).optional(),
    unread: z
        .union([z.literal("true"), z.literal("false")])
        .optional()
        .transform((v) => v === "true"),
    q: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const listMessagesQueryDto = z.object({
    afterSequence: z.coerce.number().int().min(0).optional(),
    beforeSequence: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const sendMessageDto = z.object({
    body: z.string().max(8000).optional().default(""),
    clientMessageId: z.string().uuid().optional(),
    uploadId: z.string().uuid().optional(),
    messageType: z.enum(["text", "image", "file"]).optional(),
});

export const markReadDto = z.object({
    lastReadMessageId: z.string().uuid(),
});

export const closeConversationDto = z.object({
    resolutionNote: z.string().max(2000).optional(),
});

export const openSupportDto = z.object({
    topicKey: z.string().min(1).max(64).optional().default("general"),
    subject: z.string().max(200).optional(),
});

export const createComplaintDto = z.object({
    orderId: z.string().uuid(),
    subject: z.string().max(200).optional(),
    body: z.string().max(8000).optional(),
});
