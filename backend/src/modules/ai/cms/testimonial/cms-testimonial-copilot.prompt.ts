import type { SuggestCmsTestimonialInput } from "@/modules/ai/cms/testimonial/cms-testimonial-copilot.dto.js";

export function buildCmsTestimonialCopilotPrompt(input: SuggestCmsTestimonialInput): string {
    const lines = [
        `Testimonial topic / occasion: ${input.topic}`,
        `Tone: ${input.tone}`,
    ];

    if (input.reviewerName?.trim()) {
        lines.push(`Reviewer name (use or refine): ${input.reviewerName.trim()}`);
    }
    if (input.reviewerCity?.trim()) {
        lines.push(`City / role line (use or refine): ${input.reviewerCity.trim()}`);
    }
    if (input.quote?.trim()) {
        lines.push(
            "",
            "Draft quote to polish (keep the same meaning and facts):",
            input.quote.trim(),
        );
    } else {
        lines.push("", "Draft a new placeholder testimonial quote for this topic.");
    }

    lines.push("", "Return JSON with quote, reviewerName, and optional reviewerCity.");

    return lines.join("\n");
}
