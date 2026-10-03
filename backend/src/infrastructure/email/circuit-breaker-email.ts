import { CircuitBreakerFactory } from "@/infrastructure/resilence/resilense.js";
import type { EmailMessage, IEmailProvider } from "@/infrastructure/email/email.port.js";

export class CircuitBreakerEmail implements IEmailProvider {
    private readonly breaker = CircuitBreakerFactory.create(
        async (op: () => Promise<void>) => op(),
        "email",
        { timeout: 10000, errorThresholdPercentage: 50, resetTimeout: 30000 },
    );

    constructor(private readonly inner: IEmailProvider) {}

    send(message: EmailMessage): Promise<void> {
        return this.breaker.fire(() => this.inner.send(message)) as Promise<void>;
    }
}
