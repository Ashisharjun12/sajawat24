const TAG_PATTERN = /<[^>]*>/g;

export function stripHtml(value: string): string {
    return value.replace(TAG_PATTERN, "").trim();
}

export function sanitizeAiInput(value: string, maxLength: number): string {
    return stripHtml(value).replace(/\s+/g, " ").trim().slice(0, maxLength);
}

const BLOCKED_OUTPUT_PATTERN = /<script|javascript:/i;

export function assertSafeAiOutput(text: string): void {
    if (!text.trim()) {
        throw new Error("empty AI output");
    }
    if (BLOCKED_OUTPUT_PATTERN.test(text)) {
        throw new Error("unsafe AI output");
    }
}
