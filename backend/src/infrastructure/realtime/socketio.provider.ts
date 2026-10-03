import type { Server as HttpServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import { Redis } from "ioredis";
import { Server, type Socket } from "socket.io";
import { registerChatSocket } from "@/modules/chat/socket/chat.socket.js";
import { verifyAccessToken } from "@/modules/identity/sessions/session.service.js";
import type { RealtimeEvent, RealtimePort } from "@/infrastructure/realtime/realtime.port.js";
import { presenceStore } from "@/infrastructure/realtime/presence.store.js";
import { sessionContextStore } from "@/infrastructure/realtime/session-context.store.js";
import { logger } from "@/utils/logger.js";

export class SocketIoRealtimeProvider implements RealtimePort {
    private io: Server | null = null;

    async attach(server: HttpServer): Promise<void> {
        this.io = new Server(server, {
            path: process.env.SOCKET_PATH ?? "/socket.io",
            cors: {
                origin: true,
                credentials: true,
            },
        });

        const redisUrl = process.env.REDIS_URL;
        if (redisUrl) {
            const pub = new Redis(redisUrl);
            const sub = pub.duplicate();
            this.io.adapter(createAdapter(pub, sub));
            logger.info("Socket.IO Redis adapter enabled");
        }

        this.io.use((socket, next) => {
            try {
                const token =
                    (socket.handshake.auth?.token as string | undefined) ??
                    socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, "");
                if (!token) {
                    next(new Error("unauthorized"));
                    return;
                }
                const payload = verifyAccessToken(token);
                socket.data.userId = payload.sub;
                socket.data.role = payload.role;
                next();
            } catch (err) {
                next(err instanceof Error ? err : new Error("unauthorized"));
            }
        });

        this.io.on("connection", (socket: Socket) => {
            const userId = socket.data.userId as string;
            void socket.join(`user:${userId}`);
            presenceStore.setOnline(userId, true);
            sessionContextStore.onConnect(userId);
            logger.info({ userId }, "socket connected");

            registerChatSocket(socket);

            socket.on("disconnect", () => {
                presenceStore.setOnline(userId, false);
                sessionContextStore.onDisconnect(userId);
                logger.info({ userId }, "socket disconnected");
            });
        });

        logger.info("Socket.IO attached");
    }

    async publish(event: RealtimeEvent): Promise<void> {
        if (!this.io) return;
        this.io.to(`user:${event.userId}`).emit(event.event, event.payload);
    }
}
