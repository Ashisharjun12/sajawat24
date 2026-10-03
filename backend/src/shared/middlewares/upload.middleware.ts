import multer from "multer";
import { ApiError } from "@/shared/errors/apiError.js";

const MAX_BYTES = 15 * 1024 * 1024;

export type UploadedFile = {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
};

export const uploadMemory = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: MAX_BYTES },
});

export function requireUploadFile(file: UploadedFile | undefined): UploadedFile {
    if (!file?.buffer?.length) {
        throw ApiError.badRequest("file is required");
    }
    return file;
}
