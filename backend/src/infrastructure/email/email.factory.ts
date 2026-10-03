import { _config } from "@/config/config.js";
import { CircuitBreakerEmail } from "@/infrastructure/email/circuit-breaker-email.js";
import type { IEmailProvider } from "@/infrastructure/email/email.port.js";
import { SmtpEmailProvider } from "@/infrastructure/email/provider/smtp.provider.js";

export class EmailFactory {
    private static instance: IEmailProvider | null = null;

    static getProvider(): IEmailProvider {
        if (this.instance) return this.instance;

        const name = (_config.EMAIL_PROVIDER || "smtp").toLowerCase();
        if (name !== "smtp") {
            throw new Error(
                `Unknown EMAIL_PROVIDER="${name}". Use smtp; do not change IEmailProvider.`,
            );
        }
        this.instance = new CircuitBreakerEmail(new SmtpEmailProvider());
        return this.instance;
    }
}
