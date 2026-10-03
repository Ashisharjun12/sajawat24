import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { EMAIL_THEME } from "@/modules/notifications/templates/email/email-theme.js";

const TEMPLATE_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../../notifications/templates/email/admin-email-change.ejs",
);

export async function renderAdminEmailChangeEmail(input: {
    verifyUrl: string;
    newEmail: string;
    includesPassword?: boolean;
}): Promise<string> {
    return ejs.renderFile(TEMPLATE_PATH, {
        theme: EMAIL_THEME,
        verifyUrl: input.verifyUrl,
        newEmail: input.newEmail,
        includesPassword: Boolean(input.includesPassword),
        headline: "Confirm your admin account",
        pageTitle: "Verify admin account",
    });
}
