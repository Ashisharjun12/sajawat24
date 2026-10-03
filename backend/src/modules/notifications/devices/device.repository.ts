import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    userPushDevices,
    type UserPushDevice,
} from "@/modules/notifications/devices/device.schema.js";

export interface IPushDeviceRepository {
    upsert(input: {
        userId: string;
        expoPushToken: string;
        platform: "android" | "ios";
    }): Promise<UserPushDevice>;
    listByUserId(userId: string): Promise<UserPushDevice[]>;
    deleteByToken(expoPushToken: string): Promise<void>;
}

export class PushDeviceRepository implements IPushDeviceRepository {
    async upsert(input: {
        userId: string;
        expoPushToken: string;
        platform: "android" | "ios";
    }): Promise<UserPushDevice> {
        const now = new Date();
        const [row] = await db
            .insert(userPushDevices)
            .values({
                userId: input.userId,
                expoPushToken: input.expoPushToken,
                platform: input.platform,
                lastSeenAt: now,
            })
            .onConflictDoUpdate({
                target: userPushDevices.expoPushToken,
                set: {
                    userId: input.userId,
                    platform: input.platform,
                    lastSeenAt: now,
                },
            })
            .returning();
        if (!row) throw new Error("failed to upsert push device");
        return row;
    }

    async listByUserId(userId: string): Promise<UserPushDevice[]> {
        return db.select().from(userPushDevices).where(eq(userPushDevices.userId, userId));
    }

    async deleteByToken(expoPushToken: string): Promise<void> {
        await db.delete(userPushDevices).where(eq(userPushDevices.expoPushToken, expoPushToken));
    }
}
