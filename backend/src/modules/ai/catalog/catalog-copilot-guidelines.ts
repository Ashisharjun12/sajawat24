import type { GenerateProductCopyInput } from "@/modules/ai/catalog/catalog-copilot.dto.js";

/** Inlined from former decoration-copy-guidelines tool — one-shot LLM, no tool loop. */
export const CATALOG_COPY_RULES = [
    "Write in clear English for Indian customers booking home or venue decorations.",
    "SEO-first: weave natural keywords (occasion, theme, decoration type) without keyword stuffing.",
    "Never mention prices, discounts, payment methods, or currency.",
    "Description: 2-4 sentences. First sentence must include the primary keyword (product + occasion).",
    "Description opening should work as a meta-style summary (~120-160 characters) while staying natural.",
    "Includes: 4-8 concrete items using searchable terms (balloon arch, LED backdrop, floral arrangement).",
    "Delivery and setup: 2-4 bullets mentioning setup time, venue/home, and professional team.",
    "Care instructions: 1-3 practical tips (heat, pets, indoor/outdoor).",
    "FAQs: 3-6 Q&A pairs phrased like real Google searches (long-tail, question format).",
    "Slug: lowercase, hyphenated, include main theme/occasion keyword.",
    "Do not make medical, safety certification, or competitor claims.",
];

export function buildSeoKeywordHints(input: GenerateProductCopyInput) {
    const occasion = input.parentCategoryName?.trim() || input.categoryName.trim();
    const category = input.categoryName.trim();
    const name = input.name.trim();

    return {
        primaryKeyword: `${name} ${category}`.toLowerCase(),
        secondaryKeywords: [
            `${occasion} decoration`,
            `${occasion} decoration at home`,
            `${category} package`,
            "event decoration booking",
            "decoration setup and delivery",
        ],
        searchPhrases: [
            `how much setup time for ${occasion.toLowerCase()} decoration`,
            `what is included in ${name.toLowerCase()}`,
            `${occasion.toLowerCase()} decoration near me`,
            `professional ${category.toLowerCase()} for parties`,
        ],
    };
}
