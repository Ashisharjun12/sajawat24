import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
    CreateMultipartUploadCommand,
    UploadPartCommand,
    CompleteMultipartUploadCommand
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { _config } from "@/config/config.js";
import { IStorageProvider, PresignedUrlResult, MultipartUploadStartResult } from "../storage.interface.js";

export class R2Provider implements IStorageProvider {
    private client: S3Client;
    private bucket: string;

    constructor() {
        this.bucket = _config.R2_BUCKET!;
        this.client = new S3Client({
            region: "auto",
            endpoint: `https://${_config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: _config.R2_ACCESS_KEY!,
                secretAccessKey: _config.R2_SECRET_KEY!,
            },
            requestChecksumCalculation: "WHEN_REQUIRED",
        });
    }


    // delete from r2
    async delete(publicId: string): Promise<void> {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: publicId,
        });
        await this.client.send(command);
    }

    async getObjectBuffer(key: string): Promise<Buffer> {
        const response = await this.client.send(
            new GetObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }),
        );
        const bytes = await response.Body?.transformToByteArray();
        if (!bytes) {
            throw new Error(`empty object: ${key}`);
        }
        return Buffer.from(bytes);
    }

    async putObject(key: string, body: Buffer, contentType: string): Promise<void> {
        await this.client.send(
            new PutObjectCommand({
                Bucket: this.bucket,
                Key: key,
                Body: body,
                ContentType: contentType,
            }),
        );
    }

    async headObject(key: string): Promise<{ size: number; contentType?: string } | null> {
        try {
            const response = await this.client.send(
                new HeadObjectCommand({
                    Bucket: this.bucket,
                    Key: key,
                }),
            );
            return {
                size: Number(response.ContentLength ?? 0),
                contentType: response.ContentType,
            };
        } catch {
            return null;
        }
    }

 
// generate signed url for upload
    async getPresignedUploadUrl(filename: string, contentType: string): Promise<PresignedUrlResult> {
        const folder = this.getFolderName(contentType);
        const timestamp = Date.now();
        const key = `uploads/${folder}/${timestamp}-${filename}`;

        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
        const publicUrl = this.getPublicUrl(key);
        return { uploadUrl, key, publicUrl };
    }

    async getPresignedUploadUrlForKey(key: string, contentType: string): Promise<PresignedUrlResult> {
        const command = new PutObjectCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });
        const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 3600 });
        return { uploadUrl, key, publicUrl: this.getPublicUrl(key) };
    }

    // generate signed url for download
    async getPresignedDownloadUrl(key: string): Promise<string> {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }

    // start multipart upload for large files
    async startMultipartUpload(filename: string, contentType: string): Promise<MultipartUploadStartResult> {
        const folder = this.getFolderName(contentType);
        const timestamp = Date.now();
        const key = `uploads/${folder}/${timestamp}-${filename}`;

        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            ContentType: contentType,
        });

        const response = await this.client.send(command);
        return { uploadId: response.UploadId!, key };
    }

    // generate signed url for multipart upload
    async getMultipartPartUrl(key: string, uploadId: string, partNumber: number): Promise<string> {
        const command = new UploadPartCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            PartNumber: partNumber,
        });
        return getSignedUrl(this.client, command, { expiresIn: 3600 });
    }

    // complete multipart upload for large files
    async completeMultipartUpload(key: string, uploadId: string, parts: any[]): Promise<void> {
        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucket,
            Key: key,
            UploadId: uploadId,
            MultipartUpload: { Parts: parts },
        });
        await this.client.send(command);
    }

   
    // get folder name based on file type
    private getFolderName(contentType: string): string {
        if (contentType.startsWith('image/')) return 'images';
        if (contentType === 'application/pdf') return 'pdf';
        return 'others';
    }

    public getPublicUrl(key: string): string {
        if (_config.R2_PUBLIC_URL) {
            return `${_config.R2_PUBLIC_URL}/${key}`;
        }
        return `https://${this.bucket}.${_config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`;
    }
}