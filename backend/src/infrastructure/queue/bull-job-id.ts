const MAX_JOB_ID_LENGTH = 200;

function sanitizePart(part: string | number): string {
    return String(part)
        .trim()
        .replace(/[\s:]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

/** BullMQ-safe custom job id (no colons; hyphen-separated). */
export function buildBullJobId(scope: string, ...parts: (string | number)[]): string {
    const segments = [scope, ...parts].map(sanitizePart).filter(Boolean);
    if (segments.length < 2) {
        throw new Error("buildBullJobId requires scope and at least one part");
    }
    const id = segments.join("-");
    if (id.includes(":")) {
        throw new Error("buildBullJobId produced invalid id");
    }
    if (id.length > MAX_JOB_ID_LENGTH) {
        throw new Error(`job id exceeds ${MAX_JOB_ID_LENGTH} chars`);
    }
    return id;
}

/** Mirrors BullMQ 6 custom jobId validation (colon allowed only for legacy 3-segment ids). */
export function isBullMqCompatibleJobId(jobId: string): boolean {
    if (!jobId) return false;
    if (!jobId.includes(":")) return true;
    return jobId.split(":").length === 3;
}
