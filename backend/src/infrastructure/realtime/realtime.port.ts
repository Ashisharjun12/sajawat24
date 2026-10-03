import type { Server as HttpServer } from "node:http";

export type RealtimeEvent = {
    userId: string;
    event: string;
    payload: Record<string, unknown>;
};

/**
 * V1 implementation is Noop (or FCM). Socket.IO later implements this same port.
 * Booking must never import socket.io.
 */
export interface RealtimePort {
    attach?(server: HttpServer): Promise<void>;
    publish(event: RealtimeEvent): Promise<void>;
}
