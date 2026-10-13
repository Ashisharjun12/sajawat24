import type { SuggestCmsAnnouncementInput } from "@/modules/ai/cms/announcement/cms-announcement-copilot.dto.js";

export function buildCmsAnnouncementCopilotPrompt(input: SuggestCmsAnnouncementInput): string {
    const lines = [`Announcement topic: ${input.topic}`];

    if (input.tone) {
        lines.push(`Preferred bar tone: ${input.tone}`);
    }
    if (input.href?.trim()) {
        lines.push(`Suggested link path (refine if needed): ${input.href.trim()}`);
    }
    if (input.message?.trim()) {
        lines.push(
            "",
            "Draft message to polish:",
            input.message.trim(),
        );
    } else {
        lines.push("", "Write a new short announcement bar message for this topic.");
    }

    lines.push(
        "",
        "Emoji: begin message with one fitting emoji + space (e.g. 🎉 Book..., ❤️ Celebrate..., ✨ New...).",
        "Return JSON with message, optional href, and tone.",
    );

    return lines.join("\n");
}
