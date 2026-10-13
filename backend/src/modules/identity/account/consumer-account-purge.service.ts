import type { ICartRepository } from "@/modules/booking/carts/cart.repository.js";
import type { RefundRequestRepository } from "@/modules/booking/refunds/refund-request.repository.js";
import type { IWishlistRepository } from "@/modules/catalog/wishlist/wishlist.repository.js";
import type { CustomerAddressRepository } from "@/modules/identity/addresses/customer-address.repository.js";
import type { NotificationRepository } from "@/modules/notifications/notification.repository.js";
import type { PreferenceService } from "@/modules/notifications/preferences/preference.service.js";
import type { IPushDeviceRepository } from "@/modules/notifications/devices/device.repository.js";

export interface IConsumerAccountPurgeService {
    purgeUserData(userId: string): Promise<void>;
}

export class ConsumerAccountPurgeService implements IConsumerAccountPurgeService {
    constructor(
        private readonly notifications: NotificationRepository,
        private readonly preferences: PreferenceService,
        private readonly pushDevices: IPushDeviceRepository,
        private readonly carts: ICartRepository,
        private readonly wishlist: IWishlistRepository,
        private readonly addresses: CustomerAddressRepository,
        private readonly refunds: RefundRequestRepository,
    ) {}

    async purgeUserData(userId: string): Promise<void> {
        await this.notifications.deleteInboxForUser(userId);
        await this.preferences.deleteForUser(userId);
        await this.pushDevices.deleteAllForUser(userId);
        await this.carts.deleteByUserId(userId);
        await this.wishlist.deleteAllForUser(userId);
        await this.addresses.deleteAllForUser(userId);
        await this.refunds.deleteAllForUser(userId);
    }
}
