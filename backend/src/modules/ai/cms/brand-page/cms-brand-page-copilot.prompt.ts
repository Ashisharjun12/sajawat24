import type { SuggestCmsBrandPageInput } from "@/modules/ai/cms/brand-page/cms-brand-page-copilot.dto.js";

export function buildCmsBrandPageCopilotPrompt(input: SuggestCmsBrandPageInput): string {
    const lines = [
        `Page brief / what to cover: ${input.brief}`,
        `Tone: ${input.tone}`,
    ];

    if (input.title?.trim()) {
        lines.push(
            "",
            `Page title (shown above the content — write body to match this title):`,
            input.title.trim(),
        );
    }

    lines.push(
        "",
        "Draft the full page body in Markdown. Return JSON with a single `body` field only.",
    );

    return lines.join("\n");
}
