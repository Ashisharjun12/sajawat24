import type { ProductFaq } from "@/modules/catalog/products/product.schema.js";

export const PRODUCT_COPY_MAX = 20;

export function sanitizePoints(value: string[] | undefined): string[] {
    if (!value) return [];
    return value
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, PRODUCT_COPY_MAX);
}

export function sanitizeFaqs(value: ProductFaq[] | undefined): ProductFaq[] {
    if (!value) return [];
    return value
        .map((item) => ({
            question: item.question.trim(),
            answer: item.answer.trim(),
        }))
        .filter((item) => item.question)
        .slice(0, PRODUCT_COPY_MAX);
}

export function mergeStoredPoints(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return sanitizePoints(value.filter((item): item is string => typeof item === "string"));
}

export function mergeStoredFaqs(value: unknown): ProductFaq[] {
    if (!Array.isArray(value)) return [];
    const rows: ProductFaq[] = [];
    for (const item of value) {
        if (!item || typeof item !== "object") continue;
        const record = item as Record<string, unknown>;
        if (typeof record.question !== "string" || typeof record.answer !== "string") continue;
        rows.push({ question: record.question, answer: record.answer });
    }
    return sanitizeFaqs(rows);
}
