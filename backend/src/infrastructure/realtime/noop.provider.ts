import type { RealtimeEvent, RealtimePort } from "@/infrastructure/realtime/realtime.port.js";

import type { Server as HttpServer } from "node:http";

export class NoopRealtimeProvider implements RealtimePort {
    async attach(_server: HttpServer): Promise<void> {
        return;
    }

    async publish(_event: RealtimeEvent): Promise<void> {
        return;
    }
}
