import { CircuitBreakerFactory } from "@/infrastructure/resilence/resilense.js";
import type { IStorageProvider, ObjectHead } from "@/infrastructure/storage/storage.interface.js";

export class CircuitBreakerStorage implements IStorageProvider {
    private readonly breaker = CircuitBreakerFactory.create(
        async (op: () => Promise<unknown>) => op(),
        "storage",
        { timeout: 30000, errorThresholdPercentage: 50, resetTimeout: 30000 },
    );

    getPresignedUploadUrl?: IStorageProvider["getPresignedUploadUrl"];
    getPresignedUploadUrlForKey?: IStorageProvider["getPresignedUploadUrlForKey"];
    getPresignedDownloadUrl?: IStorageProvider["getPresignedDownloadUrl"];
    startMultipartUpload?: IStorageProvider["startMultipartUpload"];
    getMultipartPartUrl?: IStorageProvider["getMultipartPartUrl"];
    completeMultipartUpload?: IStorageProvider["completeMultipartUpload"];

    constructor(private readonly inner: IStorageProvider) {
        if (inner.getPresignedUploadUrl) {
            this.getPresignedUploadUrl = (filename, contentType) =>
                this.run(() => inner.getPresignedUploadUrl!(filename, contentType));
        }
        if (inner.getPresignedUploadUrlForKey) {
            this.getPresignedUploadUrlForKey = (key, contentType) =>
                this.run(() => inner.getPresignedUploadUrlForKey!(key, contentType));
        }
        if (inner.getPresignedDownloadUrl) {
            this.getPresignedDownloadUrl = (key) => this.run(() => inner.getPresignedDownloadUrl!(key));
        }
        if (inner.startMultipartUpload) {
            this.startMultipartUpload = (filename, contentType) =>
                this.run(() => inner.startMultipartUpload!(filename, contentType));
        }
        if (inner.getMultipartPartUrl) {
            this.getMultipartPartUrl = (key, uploadId, partNumber) =>
                this.run(() => inner.getMultipartPartUrl!(key, uploadId, partNumber));
        }
        if (inner.completeMultipartUpload) {
            this.completeMultipartUpload = (key, uploadId, parts) =>
                this.run(() => inner.completeMultipartUpload!(key, uploadId, parts));
        }
    }

    private run<T>(op: () => Promise<T>): Promise<T> {
        return this.breaker.fire(op) as Promise<T>;
    }

    delete(publicId: string): Promise<void> {
        return this.run(() => this.inner.delete(publicId));
    }

    getPublicUrl(key: string): string {
        return this.inner.getPublicUrl(key);
    }

    getObjectBuffer(key: string): Promise<Buffer> {
        return this.run(() => this.inner.getObjectBuffer(key));
    }

    putObject(key: string, body: Buffer, contentType: string): Promise<void> {
        return this.run(() => this.inner.putObject(key, body, contentType));
    }

    headObject(key: string): Promise<ObjectHead | null> {
        return this.run(() => this.inner.headObject(key));
    }
}
