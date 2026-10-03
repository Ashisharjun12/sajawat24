import { slugify } from "@/modules/catalog/slug.js";

type SeoSlugInput = {
    name: string;
    categoryName?: string;
    parentCategoryName?: string;
    llmSlug?: string;
};

/** Prefer keyword-rich slugs: product name + category, deduped and capped at 120 chars. */
export function buildSeoSlug(input: SeoSlugInput): string {
    const nameSlug = slugify(input.name);
    const categorySlug = input.categoryName ? slugify(input.categoryName) : "";
    const parentSlug = input.parentCategoryName ? slugify(input.parentCategoryName) : "";

    const llmSlug = input.llmSlug ? slugify(input.llmSlug) : "";
    const combinedSlug = slugify(
        [input.name, input.categoryName, input.parentCategoryName].filter(Boolean).join(" "),
    );

    const candidates = [llmSlug, combinedSlug, [nameSlug, categorySlug].filter(Boolean).join("-"), nameSlug];

    for (const candidate of candidates) {
        const slug = dedupeSlugSegments(candidate).slice(0, 120).replace(/-+$/g, "");
        if (slug.length >= 2) return slug;
    }

    return nameSlug.length >= 2 ? nameSlug : "product";
}

function dedupeSlugSegments(slug: string): string {
    const seen = new Set<string>();
    const parts: string[] = [];
    for (const segment of slug.split("-")) {
        if (!segment || seen.has(segment)) continue;
        seen.add(segment);
        parts.push(segment);
    }
    return parts.join("-");
}
