import { CircuitBreakerFactory } from "@/infrastructure/resilence/resilense.js";
import type { ISmsProvider, SmsMessage } from "@/infrastructure/sms/sms.interface.js";

export class CircuitBreakerSms implements ISmsProvider {
    private readonly breaker = CircuitBreakerFactory.create(
        async (op: () => Promise<void>) => op(),
        "sms",
        { timeout: 8000, errorThresholdPercentage: 50, resetTimeout: 30000 },
    );

    constructor(private readonly inner: ISmsProvider) {}

    send(message: SmsMessage): Promise<void> {
        return this.breaker.fire(() => this.inner.send(message)) as Promise<void>;
    }
}
