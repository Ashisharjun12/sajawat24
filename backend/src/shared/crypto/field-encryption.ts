import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { _config } from "@/config/config.js";

const ALGO = "aes-256-gcm";

function encryptionKey(): Buffer {
    const secret = _config.JWT_SECRET ?? "decory-dev-payout-key";
    return createHash("sha256").update(secret).digest();
}

export function encryptField(plain: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGO, encryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptField(payload: string): string {
    const [ivB64, tagB64, dataB64] = payload.split(":");
    if (!ivB64 || !tagB64 || !dataB64) {
        throw new Error("invalid encrypted payload");
    }
    const decipher = createDecipheriv(ALGO, encryptionKey(), Buffer.from(ivB64, "base64"));
    decipher.setAuthTag(Buffer.from(tagB64, "base64"));
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(dataB64, "base64")),
        decipher.final(),
    ]);
    return decrypted.toString("utf8");
}

export function maskAccountNumber(accountNumber: string): string {
    const digits = accountNumber.replace(/\s/g, "");
    if (digits.length <= 4) return digits;
    return digits.slice(-4);
}
