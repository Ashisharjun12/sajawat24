import type { Job } from "bullmq";
import { storageProvider } from "@/infrastructure/storage/storage.factory.js";
import { MediaRepository } from "@/modules/upload/media/media.repository.js";
import {
    optimizedKeyFromOriginal,
    runImagePipeline,
    type ImageCrop,
    type ResizeOutput,
} from "@/modules/upload/media/image.pipeline.js";
import { safeFilename } from "@/modules/upload/media/media.public.js";
import { logger } from "@/utils/logger.js";

export type OptimizeJobData = {
    uploadId: string;
    crop?: ImageCrop;
    output?: ResizeOutput;
};

const media = new MediaRepository();

function webpFilename(filename: string): string {
    const base = filename.replace(/\.[^.]+$/, "") || "file";
    return safeFilename(`${base}.webp`);
}

export async function processOptimizeJob(job: Job<OptimizeJobData>): Promise<void> {
    const upload = await media.findById(job.data.uploadId);
    if (!upload) {
        logger.warn({ uploadId: job.data.uploadId }, "optimize skipped: upload missing");
        return;
    }
    if (upload.kind !== "image" || upload.status !== "completed") {
        await media.update(upload.id, { optimizeStatus: "failed" });
        return;
    }

    const originalKey = upload.key;

    try {
        const original = await storageProvider.getObjectBuffer(originalKey);
        const { buffer, width, height } = await runImagePipeline(
            original,
            job.data.crop,
            job.data.output,
        );
        const optimizedKey = optimizedKeyFromOriginal(originalKey);

        if (upload.optimizedKey && upload.optimizedKey !== optimizedKey) {
            await storageProvider.delete(upload.optimizedKey).catch(() => undefined);
        }

        await storageProvider.putObject(optimizedKey, buffer, "image/webp");

        if (originalKey !== optimizedKey) {
            await storageProvider.delete(originalKey);
        }

        await media.update(upload.id, {
            key: optimizedKey,
            optimizedKey: null,
            filename: webpFilename(upload.filename),
            mimeType: "image/webp",
            size: buffer.length,
            optimizedAt: new Date(),
            optimizeStatus: "completed",
            width,
            height,
        });
    } catch (err) {
        await media.update(upload.id, { optimizeStatus: "failed" });
        throw err;
    }
}
