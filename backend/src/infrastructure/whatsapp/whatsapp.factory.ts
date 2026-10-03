import { _config } from "@/config/config.js";
import type { WhatsAppPort } from "@/infrastructure/whatsapp/whatsapp.port.js";
import { Msg91WhatsAppProvider } from "@/infrastructure/whatsapp/provider/msg91.provider.js";
import { NoopWhatsAppProvider } from "@/infrastructure/whatsapp/provider/noop.provider.js";

export class WhatsAppFactory {
    private static instance: WhatsAppPort | null = null;

    static getProvider(): WhatsAppPort {
        if (this.instance) return this.instance;

        const name = (_config.WHATSAPP_PROVIDER || "noop").toLowerCase();
        switch (name) {
            case "noop":
                this.instance = new NoopWhatsAppProvider();
                return this.instance;
            case "msg91":
                this.instance = new Msg91WhatsAppProvider();
                return this.instance;
            default:
                throw new Error(
                    `Unknown WHATSAPP_PROVIDER="${name}". Add a provider file; do not change WhatsAppPort.`,
                );
        }
    }
}
