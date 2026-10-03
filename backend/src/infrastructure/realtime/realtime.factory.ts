import type { RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import { NoopRealtimeProvider } from "@/infrastructure/realtime/noop.provider.js";
import { SocketIoRealtimeProvider } from "@/infrastructure/realtime/socketio.provider.js";

export class RealtimeFactory {
    private static instance: RealtimePort | null = null;

    static getProvider(): RealtimePort {
        if (this.instance) return this.instance;

        const name = (process.env.REALTIME_PROVIDER ?? "noop").toLowerCase();
        switch (name) {
            case "noop":
                this.instance = new NoopRealtimeProvider();
                return this.instance;
            case "socketio":
                this.instance = new SocketIoRealtimeProvider();
                return this.instance;
            default:
                throw new Error(`Unknown REALTIME_PROVIDER="${name}". Add a provider file; do not change RealtimePort.`);
        }
    }
}
