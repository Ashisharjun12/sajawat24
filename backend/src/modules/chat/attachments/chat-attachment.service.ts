import { randomUUID } from "node:crypto";
import { ApiError } from "@/shared/errors/apiError.js";
import { safeFilename } from "@/modules/upload/media/media.public.js";
import type { IMediaRepository } from "@/modules/upload/media/media.repository.js";
import type { IMediaService } from "@/modules/upload/media/media.service.js";
import type { IConversationRepository } from "@/modules/chat/conversations/conversation.repository.js";
import type { IChatAclService } from "@/modules/chat/services/chat-acl.service.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";
import type { PresignChatAttachmentInput } from "@/modules/chat/attachments/chat-attachment.dto.js";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const FILE_MIMES = new Set(["application/pdf"]);
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export type ChatAttachmentPresignResult = {
    uploadId: string;
    uploadUrl: string;
    publicUrl: string;
};

export interface IChatAttachmentService {
    presign(
        userId: string,
        role: UserRole,
        conversationId: string,
        input: PresignChatAttachmentInput,
    ): Promise<ChatAttachmentPresignResult>;
    complete(
        userId: string,
        role: UserRole,
        conversationId: string,
        uploadId: string,
    ): Promise<ChatAttachmentPresignResult>;
}

function assertChatMime(kind: PresignChatAttachmentInput["kind"], mimeType: string) {
    if (kind === "image" && !IMAGE_MIMES.has(mimeType)) {
        throw ApiError.badRequest("unsupported image type");
    }
    if (kind === "file" && !FILE_MIMES.has(mimeType)) {
        throw ApiError.badRequest("unsupported file type");
    }
}

function maxBytesForKind(kind: PresignChatAttachmentInput["kind"]): number {
    return kind === "file" ? MAX_FILE_BYTES : MAX_IMAGE_BYTES;
}

export class ChatAttachmentService implements IChatAttachmentService {
    constructor(
        private readonly conversations: IConversationRepository,
        private readonly acl: IChatAclService,
        private readonly media: IMediaService,
        private readonly mediaRepo: IMediaRepository,
    ) {}

    private async assertCanUpload(userId: string, role: UserRole, conversationId: string) {
        const conversation = await this.conversations.findById(conversationId);
        if (!conversation) throw ApiError.notFound("conversation not found");
        await this.acl.assertCanSend(userId, role, conversation);
        return conversation;
    }

    async presign(
        userId: string,
        role: UserRole,
        conversationId: string,
        input: PresignChatAttachmentInput,
    ): Promise<ChatAttachmentPresignResult> {
        await this.assertCanUpload(userId, role, conversationId);
        const mimeType = input.mimeType.trim().toLowerCase();
        assertChatMime(input.kind, mimeType);

        const uploadId = randomUUID();
        const filename = safeFilename(input.fileName);
        const storageKey = `chat/${conversationId}/${uploadId}-${filename}`;

        const result = await this.media.presign({
            id: uploadId,
            filename,
            mimeType,
            kind: input.kind,
            uploadedBy: userId,
            storageKey,
        });

        if (result.uploadMode !== "direct") {
            throw ApiError.internalServerError("direct upload is required for chat attachments");
        }

        return {
            uploadId: result.id,
            uploadUrl: result.uploadUrl,
            publicUrl: result.publicUrl,
        };
    }

    async complete(
        userId: string,
        role: UserRole,
        conversationId: string,
        uploadId: string,
    ): Promise<ChatAttachmentPresignResult> {
        await this.assertCanUpload(userId, role, conversationId);

        const existing = await this.mediaRepo.findById(uploadId);
        if (!existing) throw ApiError.notFound("upload not found");
        if (existing.uploadedBy !== userId) {
            throw ApiError.forbidden("upload does not belong to user");
        }
        if (!existing.key.startsWith(`chat/${conversationId}/`)) {
            throw ApiError.badRequest("upload does not belong to conversation");
        }

        const completed = await this.media.complete(uploadId);
        const row = await this.mediaRepo.findById(uploadId);
        const maxBytes = maxBytesForKind(row?.kind === "file" ? "file" : "image");
        if (row?.size && row.size > maxBytes) {
            throw ApiError.badRequest("attachment exceeds size limit");
        }

        return {
            uploadId: completed.id,
            uploadUrl: "",
            publicUrl: completed.publicUrl,
        };
    }
}
