import { logger } from "@/utils/logger.js";
import type { WhatsAppMessage, WhatsAppPort } from "@/infrastructure/whatsapp/whatsapp.port.js";

export class NoopWhatsAppProvider implements WhatsAppPort {
    async send(message: WhatsAppMessage): Promise<void> {
        logger.info(
            { to: message.to, template: message.template },
            "NoopWhatsAppProvider: skipped",
        );
    }
}
