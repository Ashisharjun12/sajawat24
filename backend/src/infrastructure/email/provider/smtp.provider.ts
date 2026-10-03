import nodemailer from "nodemailer";
import { _config } from "@/config/config.js";
import type { EmailMessage, IEmailProvider } from "@/infrastructure/email/email.port.js";
import { logger } from "@/utils/logger.js";

export class SmtpEmailProvider implements IEmailProvider {
    private readonly transporter: ReturnType<typeof nodemailer.createTransport>;
    private readonly from: string;

    constructor() {
        const host = _config.SMTP_HOST;
        const user = _config.SMTP_USER;
        const pass = _config.SMTP_PASSWORD;
        const port = Number(_config.SMTP_PORT || "587");

        if (!host || !user || !pass) {
            throw new Error(
                "SMTP_HOST, SMTP_USER, and SMTP_PASSWORD are required when EMAIL_PROVIDER=smtp",
            );
        }

        this.from = user;
        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure: port === 465,
            auth: { user, pass },
        });
    }

    async send(message: EmailMessage): Promise<void> {
        const result = await this.transporter.sendMail({
            from: this.from,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
        });
        logger.info({ messageId: result.messageId, to: message.to }, "SMTP email sent");
    }
}
