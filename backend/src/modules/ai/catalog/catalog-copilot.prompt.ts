import type { GenerateProductCopyInput } from "@/modules/ai/catalog/catalog-copilot.dto.js";
import {
    buildSeoKeywordHints,
    CATALOG_COPY_RULES,
} from "@/modules/ai/catalog/catalog-copilot-guidelines.js";

export function buildCatalogCopilotPrompt(input: GenerateProductCopyInput): string {
    const seo = buildSeoKeywordHints(input);
    const lines = [
        `Product name: ${input.name}`,
        `Category: ${input.categoryName}`,
    ];

    if (input.parentCategoryName) {
        lines.push(`Parent category: ${input.parentCategoryName}`);
    }

    lines.push(`Tone: ${input.tone}`);

    if (input.notes?.trim()) {
        lines.push(`Additional notes from admin: ${input.notes.trim()}`);
    }

    lines.push(
        "",
        "## Copy rules",
        ...CATALOG_COPY_RULES.map((rule) => `- ${rule}`),
        "",
        "## SEO hints (use naturally in description and FAQs)",
        `Primary keyword: ${seo.primaryKeyword}`,
        `Secondary keywords: ${seo.secondaryKeywords.join(", ")}`,
        `Example search phrases: ${seo.searchPhrases.join("; ")}`,
        "",
        "Generate all fields in one response: description, slug, includes, deliverySetup, careInstructions, faqs.",
        "Return JSON matching the required schema only.",
    );

    return lines.join("\n");
}
