export type PresignedUrlResult = {
    uploadUrl: string;
    key: string;
    signature?: string;
    timestamp?: number;
    apiKey?: string;
    publicUrl?: string;
};

export type MultipartUploadStartResult = {
    uploadId: string;
    key: string;
};

export type ObjectHead = {
    size: number;
    contentType?: string;
};

export interface IStorageProvider {
    delete(publicId: string): Promise<void>;
    getPublicUrl(key: string): string;
    getObjectBuffer(key: string): Promise<Buffer>;
    putObject(key: string, body: Buffer, contentType: string): Promise<void>;
    headObject(key: string): Promise<ObjectHead | null>;

    getPresignedUploadUrl?(filename: string, contentType: string): Promise<PresignedUrlResult>;
    getPresignedUploadUrlForKey?(key: string, contentType: string): Promise<PresignedUrlResult>;
    getPresignedDownloadUrl?(key: string): Promise<string>;

    startMultipartUpload?(filename: string, contentType: string): Promise<MultipartUploadStartResult>;
    getMultipartPartUrl?(key: string, uploadId: string, partNumber: number): Promise<string>;
    completeMultipartUpload?(key: string, uploadId: string, parts: any[]): Promise<void>;
}
