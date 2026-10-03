import { logger } from "@/utils/logger.js";
import type { ISmsProvider, SmsMessage } from "@/infrastructure/sms/sms.interface.js";

export class DevSmsProvider implements ISmsProvider {
    async send(message: SmsMessage): Promise<void> {
        logger.info({ to: message.to, body: message.body }, "DevSmsProvider: SMS (not sent)");
    }
}
