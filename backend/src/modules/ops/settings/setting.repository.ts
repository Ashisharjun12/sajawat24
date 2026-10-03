import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    platformSettings,
    type PlatformSetting,
} from "@/modules/ops/settings/setting.schema.js";

export interface ISettingRepository {
    findByKey(key: string): Promise<PlatformSetting | undefined>;
    upsert(key: string, value: Record<string, unknown>): Promise<PlatformSetting>;
}

export class SettingRepository implements ISettingRepository {
    async findByKey(key: string): Promise<PlatformSetting | undefined> {
        const [row] = await db
            .select()
            .from(platformSettings)
            .where(eq(platformSettings.key, key))
            .limit(1);
        return row;
    }

    async upsert(key: string, value: Record<string, unknown>): Promise<PlatformSetting> {
        const [row] = await db
            .insert(platformSettings)
            .values({ key, value, updatedAt: new Date() })
            .onConflictDoUpdate({
                target: platformSettings.key,
                set: { value, updatedAt: new Date() },
            })
            .returning();
        if (!row) {
            throw new Error("failed to upsert platform setting");
        }
        return row;
    }
}
