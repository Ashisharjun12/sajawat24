import type { IPushDeviceRepository } from "@/modules/notifications/devices/device.repository.js";
import type { RegisterPushDeviceInput, UnregisterPushDeviceInput } from "@/modules/notifications/devices/device.dto.js";

export interface IPushDeviceService {
    register(userId: string, input: RegisterPushDeviceInput): Promise<void>;
    unregister(userId: string, input: UnregisterPushDeviceInput): Promise<void>;
    listTokensForUser(userId: string): Promise<string[]>;
    removeStaleToken(token: string): Promise<void>;
}

export class PushDeviceService implements IPushDeviceService {
    constructor(private readonly devices: IPushDeviceRepository) {}

    async register(userId: string, input: RegisterPushDeviceInput): Promise<void> {
        await this.devices.upsert({
            userId,
            expoPushToken: input.token,
            platform: input.platform,
        });
    }

    async unregister(userId: string, input: UnregisterPushDeviceInput): Promise<void> {
        const owned = await this.devices.listByUserId(userId);
        if (owned.some((row) => row.expoPushToken === input.token)) {
            await this.devices.deleteByToken(input.token);
        }
    }

    async listTokensForUser(userId: string): Promise<string[]> {
        const rows = await this.devices.listByUserId(userId);
        return rows.map((row) => row.expoPushToken);
    }

    async removeStaleToken(token: string): Promise<void> {
        await this.devices.deleteByToken(token);
    }
}
