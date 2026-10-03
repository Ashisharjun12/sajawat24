import { _config } from "@/config/config.js";
import type { ISmsProvider } from "@/infrastructure/sms/sms.interface.js";
import { CircuitBreakerSms } from "@/infrastructure/sms/circuit-breaker-sms.js";
import { DevSmsProvider } from "@/infrastructure/sms/provider/dev.provider.js";
import { Msg91SmsProvider } from "@/infrastructure/sms/provider/msg91.provider.js";

export class SmsFactory {
    private static instance: ISmsProvider | null = null;

    static getProvider(): ISmsProvider {
        if (this.instance) return this.instance;

        const name = (_config.SMS_PROVIDER || "dev").toLowerCase();
        switch (name) {
            case "dev":
                this.instance = new DevSmsProvider();
                return this.instance;
            case "msg91":
                this.instance = new CircuitBreakerSms(new Msg91SmsProvider());
                return this.instance;
            default:
                throw new Error(
                    `Unknown SMS_PROVIDER="${name}". Supported: dev, msg91. See docs/sms.md.`,
                );
        }
    }
}
