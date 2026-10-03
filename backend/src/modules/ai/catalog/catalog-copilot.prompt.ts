import type { GenerateProductCopyInput } from "@/modules/ai/catalog/catalog-copilot.dto.js";

export function buildCatalogCopilotPrompt(input: GenerateProductCopyInput): string {
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
        "Generate SEO-friendly product listing copy for this decoration package.",
        "Optimize for search: natural keywords in the description, searchable item names, and FAQ questions people type into Google.",
        "Use your tools for guidelines, SEO keyword hints, slug, and bullet sanitization.",
        "Return structured JSON matching the required schema.",
    );

    return lines.join("\n");
}
