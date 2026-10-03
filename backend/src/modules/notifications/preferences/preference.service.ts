import DbFactory from "@/infrastructure/database/db.factory.js";
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import type { UserNotificationPreference } from "@/modules/notifications/schema.js";

const CACHE_TTL_SECONDS = 60;

export const DEFAULT_PREFERENCES: Omit<UserNotificationPreference, "userId" | "updatedAt"> = {
    sms: true,
    email: true,
    push: true,
    inApp: true,
    whatsapp: false,
    promotionalEmail: false,
    promotionalSms: false,
};

export type PreferencePatch = Partial<typeof DEFAULT_PREFERENCES>;

function cacheKey(userId: string) {
    return `pref:${userId}`;
}

export class PreferenceService {
    constructor(private readonly repo: NotificationRepository) {}

    async get(userId: string): Promise<UserNotificationPreference> {
        const redis = DbFactory.getRedisDatabase().getClient();
        const cached = await redis.get(cacheKey(userId));
        if (cached) {
            return JSON.parse(cached) as UserNotificationPreference;
        }
        const row = await this.repo.findPreference(userId);
        const value: UserNotificationPreference = row ?? {
            userId,
            ...DEFAULT_PREFERENCES,
            updatedAt: new Date(),
        };
        await redis.set(cacheKey(userId), JSON.stringify(value), "EX", CACHE_TTL_SECONDS);
        return value;
    }

    async put(userId: string, patch: PreferencePatch): Promise<UserNotificationPreference> {
        const row = await this.repo.upsertPreference(userId, patch);
        const redis = DbFactory.getRedisDatabase().getClient();
        await redis.del(cacheKey(userId));
        return row;
    }
}
