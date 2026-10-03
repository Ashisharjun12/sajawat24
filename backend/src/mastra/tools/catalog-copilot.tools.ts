import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { buildSeoSlug } from "@/modules/ai/lib/build-seo-slug.js";

const MAX_BULLETS = 20;

export const slugifyProductTool = createTool({
    id: "slugify-product",
    description:
        "Build an SEO-friendly URL slug from the product name and category (keyword-rich, hyphenated, lowercase).",
    inputSchema: z.object({
        name: z.string().min(2).max(120),
        categoryName: z.string().min(1).max(120).optional(),
        parentCategoryName: z.string().min(1).max(120).optional(),
    }),
    outputSchema: z.object({
        slug: z.string().min(2),
    }),
    execute: async (input) => ({
        slug: buildSeoSlug({
            name: input.name,
            categoryName: input.categoryName,
            parentCategoryName: input.parentCategoryName,
        }),
    }),
});

export const seoKeywordHintsTool = createTool({
    id: "seo-keyword-hints",
    description:
        "Suggest primary and secondary SEO keywords and FAQ search phrases for a decoration product listing.",
    inputSchema: z.object({
        name: z.string().min(2).max(120),
        categoryName: z.string().min(1).max(120),
        parentCategoryName: z.string().min(1).max(120).optional(),
    }),
    outputSchema: z.object({
        primaryKeyword: z.string(),
        secondaryKeywords: z.array(z.string()),
        searchPhrases: z.array(z.string()),
        tips: z.array(z.string()),
    }),
    execute: async (input) => {
        const occasion = input.parentCategoryName?.trim() || input.categoryName.trim();
        const category = input.categoryName.trim();
        const name = input.name.trim();

        const primaryKeyword = `${name} ${category}`.toLowerCase();
        const secondaryKeywords = [
            `${occasion} decoration`,
            `${occasion} decoration at home`,
            `${category} package`,
            "event decoration booking",
            "decoration setup and delivery",
        ];
        const searchPhrases = [
            `how much setup time for ${occasion.toLowerCase()} decoration`,
            `what is included in ${name.toLowerCase()}`,
            `${occasion.toLowerCase()} decoration near me`,
            `professional ${category.toLowerCase()} for parties`,
        ];

        return {
            primaryKeyword,
            secondaryKeywords,
            searchPhrases,
            tips: [
                "Open the description with the primary keyword in the first sentence.",
                "Use specific decoration terms customers search for (balloon arch, backdrop, fairy lights).",
                "Write FAQ questions the way people search on Google.",
                "Keep the slug short but include the main occasion or theme keyword.",
            ],
        };
    },
});

export const decorationCopyGuidelinesTool = createTool({
    id: "decoration-copy-guidelines",
    description:
        "Returns Decory copy rules for event decoration product listings. Call before writing final copy.",
    inputSchema: z.object({}),
    outputSchema: z.object({
        rules: z.array(z.string()),
    }),
    execute: async () => ({
        rules: [
            "Write in clear English for Indian customers booking home or venue decorations.",
            "SEO-first: weave natural keywords (occasion, theme, decoration type) without keyword stuffing.",
            "Never mention prices, discounts, payment methods, or currency.",
            "Description: 2-4 sentences. First sentence must include the primary keyword (product + occasion).",
            "Description opening should work as a meta-style summary (~120-160 characters) while staying natural.",
            "Includes: 4-8 concrete items using searchable terms (balloon arch, LED backdrop, floral arrangement).",
            "Delivery and setup: 2-4 bullets mentioning setup time, venue/home, and professional team.",
            "Care instructions: 1-3 practical tips (heat, pets, indoor/outdoor).",
            "FAQs: 3-6 Q&A pairs phrased like real Google searches (long-tail, question format).",
            "Slug: lowercase, hyphenated, include main theme/occasion keyword; call slugify-product with category.",
            "Do not make medical, safety certification, or competitor claims.",
        ],
    }),
});

export const sanitizeBulletListTool = createTool({
    id: "sanitize-bullet-list",
    description: "Trim, dedupe, and cap a bullet list for product copy fields.",
    inputSchema: z.object({
        items: z.array(z.string()).max(40),
        maxItems: z.number().int().min(1).max(MAX_BULLETS).optional(),
    }),
    outputSchema: z.object({
        items: z.array(z.string()),
    }),
    execute: async (input) => {
        const max = input.maxItems ?? MAX_BULLETS;
        const seen = new Set<string>();
        const items: string[] = [];
        for (const raw of input.items) {
            const text = raw.trim().replace(/\s+/g, " ");
            if (!text) continue;
            const key = text.toLowerCase();
            if (seen.has(key)) continue;
            seen.add(key);
            items.push(text);
            if (items.length >= max) break;
        }
        return { items };
    },
});

export const catalogCopilotTools = {
    slugifyProduct: slugifyProductTool,
    seoKeywordHints: seoKeywordHintsTool,
    decorationCopyGuidelines: decorationCopyGuidelinesTool,
    sanitizeBulletList: sanitizeBulletListTool,
};
