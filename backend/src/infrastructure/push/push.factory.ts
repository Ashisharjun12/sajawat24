import type { PushPort } from "@/infrastructure/push/push.port.js";
import { ExpoPushProvider } from "@/infrastructure/push/expo.provider.js";

export class PushFactory {
    private static instance: PushPort | null = null;

    static getProvider(): PushPort {
        if (this.instance) return this.instance;

        const name = (process.env.PUSH_PROVIDER ?? "expo").toLowerCase();
        switch (name) {
            case "expo":
                this.instance = new ExpoPushProvider();
                return this.instance;
            default:
                throw new Error(`Unknown PUSH_PROVIDER="${name}". Add a provider file; do not change PushPort.`);
        }
    }
}
