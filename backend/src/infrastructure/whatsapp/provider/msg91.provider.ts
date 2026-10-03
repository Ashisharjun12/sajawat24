import { sendMsg91Flow } from "@/infrastructure/sms/provider/msg91.flow.provider.js";
import type { WhatsAppMessage, WhatsAppPort } from "@/infrastructure/whatsapp/whatsapp.port.js";

export class Msg91WhatsAppProvider implements WhatsAppPort {
    async send(message: WhatsAppMessage): Promise<void> {
        await sendMsg91Flow({
            to: message.to,
            event: message.meta?.event ?? message.template,
            eventData: message.meta?.eventData ?? message.data,
        });
    }
}
