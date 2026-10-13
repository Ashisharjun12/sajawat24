import type { SuggestCmsFaqInput } from "@/modules/ai/cms/faq/cms-faq-copilot.dto.js";

export function buildCmsFaqCopilotPrompt(input: SuggestCmsFaqInput): string {
    const lines = [
        `FAQ topic / context: ${input.topic}`,
        `Tone: ${input.tone}`,
    ];

    if (input.question?.trim()) {
        lines.push(
            "",
            `The admin already drafted this question (you may refine it slightly for SEO, or keep it):`,
            input.question.trim(),
            "",
            "Return a complete question and answer. If the draft question is good, keep it and write the answer.",
        );
    } else {
        lines.push(
            "",
            "Draft one FAQ question and answer for the home FAQ section about this topic.",
        );
    }

    lines.push("", "Return JSON with question and answer only.");

    return lines.join("\n");
}
