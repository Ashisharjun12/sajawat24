import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_THEME } from "@/modules/notifications/templates/email/email-theme.js";

const TEMPLATE_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "dispatch-exhausted.ejs",
);

export async function renderDispatchExhaustedEmailHtml(input: {
    intro: string;
    orderRef: string;
    city: string;
    address: string;
    adminUrl: string;
}): Promise<string> {
    return ejs.renderFile(TEMPLATE_PATH, {
        theme: EMAIL_THEME,
        pageTitle: "Assign a vendor",
        headline: "No vendor accepted",
        badge: "Instant dispatch",
        intro: input.intro,
        orderRef: input.orderRef,
        city: input.city,
        address: input.address,
        adminUrl: input.adminUrl,
    });
}
