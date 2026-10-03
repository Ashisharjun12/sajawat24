import { ApiError } from "@/shared/errors/apiError.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import type { ISettingRepository } from "@/modules/ops/settings/setting.repository.js";
import {
    BOOKING_POLICY_KEY,
    DEFAULT_BOOKING_POLICY,
    mergeBookingPolicy,
    type BookingPolicy,
} from "@/modules/ops/settings/booking-policy.js";
import {
    NOTIFY_CHANNELS_KEY,
    mergeNotificationChannels,
    type NotificationChannel,
    type NotificationChannelFlags,
} from "@/modules/ops/settings/notification-channels.js";
import {
    PAY_METHODS_KEY,
    exclusiveOnlineProviders,
    mergePaymentMethods,
    toPublicPaymentMethods,
    type PaymentMethodFlags,
    type PublicPaymentMethods,
} from "@/modules/ops/settings/payment-methods.js";
import {
    DEFAULT_PAYOUT_POLICY,
    mergePayoutPolicy,
    PAYOUT_POLICY_KEY,
    type PayoutPolicy,
} from "@/modules/ops/settings/payout-policy.js";
import {
    DEFAULT_INSTANT_DISPATCH_POLICY,
    INSTANT_DISPATCH_KEY,
    mergeInstantDispatchPolicy,
    type InstantDispatchPolicy,
} from "@/modules/ops/settings/instant-dispatch-policy.js";
import {
    DEFAULT_INSTANT_MAPS_POLICY,
    INSTANT_MAPS_KEY,
    mergeInstantMapsPolicy,
    type InstantMapsPolicy,
} from "@/modules/ops/settings/instant-maps-policy.js";
import {
    DEFAULT_INSTANT_MARKETPLACE_POLICY,
    INSTANT_MARKETPLACE_KEY,
    mergeInstantMarketplacePolicy,
    type InstantMarketplacePolicy,
} from "@/modules/ops/settings/instant-marketplace-policy.js";
import {
    applyDemoAuthPatch,
    DEFAULT_DEMO_AUTH_POLICY,
    DEMO_AUTH_KEY,
    mergeDemoAuthPolicy,
    toDemoAuthAdminView,
    type DemoAuthAdminView,
    type DemoAuthPolicy,
    type PatchDemoAuthPolicyInput,
} from "@/modules/ops/settings/demo-auth-policy.js";
import {
    ensureInstantDispatchSystemUser,
    type InstantDispatchSystemUserResult,
} from "@/modules/ops/settings/instant-dispatch-system-user.js";

const CHANNEL_CACHE_TTL_MS = 5_000;

export type PatchNotificationChannelsInput = Partial<NotificationChannelFlags>;
export type PatchPaymentMethodsInput = Partial<PaymentMethodFlags>;
export type PatchPayoutPolicyInput = Partial<PayoutPolicy>;
export type PatchBookingPolicyInput = Partial<BookingPolicy>;
export type PatchInstantDispatchInput = Partial<InstantDispatchPolicy>;
export type PatchInstantMapsInput = Partial<InstantMapsPolicy>;
export type PatchInstantMarketplaceInput = Partial<InstantMarketplacePolicy>;
export type { PatchDemoAuthPolicyInput } from "@/modules/ops/settings/demo-auth-policy.js";

export interface ISettingService {
    getNotificationChannels(): Promise<NotificationChannelFlags>;
    patchNotificationChannels(
        input: PatchNotificationChannelsInput,
        actorId: string,
    ): Promise<NotificationChannelFlags>;
    isChannelEnabled(channel: NotificationChannel): Promise<boolean>;
    getPaymentMethods(): Promise<PublicPaymentMethods>;
    patchPaymentMethods(input: PatchPaymentMethodsInput, actorId: string): Promise<PublicPaymentMethods>;
    getPayoutPolicy(): Promise<PayoutPolicy>;
    patchPayoutPolicy(input: PatchPayoutPolicyInput, actorId: string): Promise<PayoutPolicy>;
    getBookingPolicy(): Promise<BookingPolicy>;
    patchBookingPolicy(input: PatchBookingPolicyInput, actorId: string): Promise<BookingPolicy>;
    getInstantDispatchPolicy(): Promise<InstantDispatchPolicy>;
    patchInstantDispatchPolicy(
        input: PatchInstantDispatchInput,
        actorId: string,
    ): Promise<InstantDispatchPolicy>;
    resolveInstantDispatchSystemUser(): Promise<InstantDispatchSystemUserResult>;
    getInstantMapsPolicy(): Promise<InstantMapsPolicy>;
    patchInstantMapsPolicy(input: PatchInstantMapsInput, actorId: string): Promise<InstantMapsPolicy>;
    getInstantMarketplacePolicy(): Promise<InstantMarketplacePolicy>;
    patchInstantMarketplacePolicy(
        input: PatchInstantMarketplaceInput,
        actorId: string,
    ): Promise<InstantMarketplacePolicy>;
    getDemoAuthPolicy(): Promise<DemoAuthPolicy>;
    getDemoAuthAdmin(): Promise<DemoAuthAdminView>;
    patchDemoAuthPolicy(input: PatchDemoAuthPolicyInput, actorId: string): Promise<DemoAuthAdminView>;
    getPublicInstantConfig(): Promise<{
        dispatchEnabled: boolean;
        marketplaceEnabled: boolean;
        maps: {
            customerApp: boolean;
            vendorApp: boolean;
            web: boolean;
            liveTracking: boolean;
            provider: string;
        };
        presence?: {
            heartbeatSec: number;
            locationMinIntervalSec: number;
            locationMinMoveM: number;
        };
    }>;
}

export class SettingService implements ISettingService {
    private notifyCache: { flags: NotificationChannelFlags; at: number } | null = null;
    private payCache: { flags: PaymentMethodFlags; at: number } | null = null;
    private payoutCache: { policy: PayoutPolicy; at: number } | null = null;
    private bookingCache: { policy: BookingPolicy; at: number } | null = null;
    private instantDispatchCache: { policy: InstantDispatchPolicy; at: number } | null = null;
    private instantMapsCache: { policy: InstantMapsPolicy; at: number } | null = null;
    private instantMarketplaceCache: { policy: InstantMarketplacePolicy; at: number } | null = null;
    private demoAuthCache: { policy: DemoAuthPolicy; at: number } | null = null;

    constructor(private readonly settings: ISettingRepository) {}

    async getNotificationChannels(): Promise<NotificationChannelFlags> {
        if (this.notifyCache && Date.now() - this.notifyCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.notifyCache.flags;
        }

        const row = await this.settings.findByKey(NOTIFY_CHANNELS_KEY);
        const flags = mergeNotificationChannels(row?.value);
        if (!row) {
            await this.settings.upsert(NOTIFY_CHANNELS_KEY, flags);
        }
        this.notifyCache = { flags, at: Date.now() };
        return flags;
    }

    async patchNotificationChannels(
        input: PatchNotificationChannelsInput,
        actorId: string,
    ): Promise<NotificationChannelFlags> {
        const current = await this.getNotificationChannels();
        const flags: NotificationChannelFlags = {
            ...current,
            ...input,
        };
        await this.settings.upsert(NOTIFY_CHANNELS_KEY, flags);
        this.notifyCache = { flags, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.notification_channels_updated",
            entityType: "settings",
            entityId: NOTIFY_CHANNELS_KEY,
            summary: "Notification channel flags updated",
            before: current,
            after: flags,
        });
        return flags;
    }

    async isChannelEnabled(channel: NotificationChannel): Promise<boolean> {
        const flags = await this.getNotificationChannels();
        return flags[channel];
    }

    async getPaymentMethods(): Promise<PublicPaymentMethods> {
        const flags = await this.loadPaymentFlags();
        return toPublicPaymentMethods(flags);
    }

    async patchPaymentMethods(
        input: PatchPaymentMethodsInput,
        actorId: string,
    ): Promise<PublicPaymentMethods> {
        const current = await this.loadPaymentFlags();
        const flags = exclusiveOnlineProviders(
            {
                ...current,
                ...input,
            },
            input,
        );
        if (!flags.cod && !flags.razorpay && !flags.cashfree) {
            throw ApiError.badRequest("enable at least one payment method");
        }
        await this.settings.upsert(PAY_METHODS_KEY, flags);
        this.payCache = { flags, at: Date.now() };
        const publicMethods = toPublicPaymentMethods(flags);
        await auditService.log({
            actorId,
            action: "settings.payment_methods_updated",
            entityType: "settings",
            entityId: PAY_METHODS_KEY,
            summary: "Payment methods updated",
            before: toPublicPaymentMethods(current),
            after: publicMethods,
        });
        return publicMethods;
    }

    async getPayoutPolicy(): Promise<PayoutPolicy> {
        if (this.payoutCache && Date.now() - this.payoutCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.payoutCache.policy;
        }
        const row = await this.settings.findByKey(PAYOUT_POLICY_KEY);
        const policy = mergePayoutPolicy(row?.value ?? DEFAULT_PAYOUT_POLICY);
        if (!row) {
            await this.settings.upsert(PAYOUT_POLICY_KEY, policy);
        }
        this.payoutCache = { policy, at: Date.now() };
        return policy;
    }

    async patchPayoutPolicy(input: PatchPayoutPolicyInput, actorId: string): Promise<PayoutPolicy> {
        const current = await this.getPayoutPolicy();
        const policy = mergePayoutPolicy({ ...current, ...input });
        await this.settings.upsert(PAYOUT_POLICY_KEY, policy);
        this.payoutCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.payout_policy_updated",
            entityType: "settings",
            entityId: PAYOUT_POLICY_KEY,
            summary: "Payout policy updated",
            before: current,
            after: policy,
        });
        return policy;
    }

    async getBookingPolicy(): Promise<BookingPolicy> {
        if (this.bookingCache && Date.now() - this.bookingCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.bookingCache.policy;
        }
        const row = await this.settings.findByKey(BOOKING_POLICY_KEY);
        const policy = mergeBookingPolicy(row?.value ?? DEFAULT_BOOKING_POLICY);
        if (!row) {
            await this.settings.upsert(BOOKING_POLICY_KEY, policy);
        }
        this.bookingCache = { policy, at: Date.now() };
        return policy;
    }

    async patchBookingPolicy(input: PatchBookingPolicyInput, actorId: string): Promise<BookingPolicy> {
        const current = await this.getBookingPolicy();
        const policy = mergeBookingPolicy({ ...current, ...input });
        await this.settings.upsert(BOOKING_POLICY_KEY, policy);
        this.bookingCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.booking_policy_updated",
            entityType: "settings",
            entityId: BOOKING_POLICY_KEY,
            summary: "Booking platform policy updated",
            before: current,
            after: policy,
        });
        return policy;
    }

    async getInstantDispatchPolicy(): Promise<InstantDispatchPolicy> {
        if (this.instantDispatchCache && Date.now() - this.instantDispatchCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.instantDispatchCache.policy;
        }
        const row = await this.settings.findByKey(INSTANT_DISPATCH_KEY);
        const policy = mergeInstantDispatchPolicy(row?.value ?? DEFAULT_INSTANT_DISPATCH_POLICY);
        if (!row) {
            await this.settings.upsert(INSTANT_DISPATCH_KEY, policy);
        }
        this.instantDispatchCache = { policy, at: Date.now() };
        return policy;
    }

    async patchInstantDispatchPolicy(
        input: PatchInstantDispatchInput,
        actorId: string,
    ): Promise<InstantDispatchPolicy> {
        const current = await this.getInstantDispatchPolicy();
        const policy = mergeInstantDispatchPolicy({ ...current, ...input });
        await this.settings.upsert(INSTANT_DISPATCH_KEY, policy);
        this.instantDispatchCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.instant_dispatch_updated",
            entityType: "settings",
            entityId: INSTANT_DISPATCH_KEY,
            summary: "Instant dispatch policy updated",
            before: current,
            after: policy,
        });
        return policy;
    }

    async resolveInstantDispatchSystemUser(): Promise<InstantDispatchSystemUserResult> {
        const policy = await this.getInstantDispatchPolicy();
        return ensureInstantDispatchSystemUser(policy.systemUserId);
    }

    async getInstantMapsPolicy(): Promise<InstantMapsPolicy> {
        if (this.instantMapsCache && Date.now() - this.instantMapsCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.instantMapsCache.policy;
        }
        const row = await this.settings.findByKey(INSTANT_MAPS_KEY);
        const policy = mergeInstantMapsPolicy(row?.value ?? DEFAULT_INSTANT_MAPS_POLICY);
        if (!row) {
            await this.settings.upsert(INSTANT_MAPS_KEY, policy);
        }
        this.instantMapsCache = { policy, at: Date.now() };
        return policy;
    }

    async patchInstantMapsPolicy(
        input: PatchInstantMapsInput,
        actorId: string,
    ): Promise<InstantMapsPolicy> {
        const current = await this.getInstantMapsPolicy();
        const policy = mergeInstantMapsPolicy({ ...current, ...input });
        await this.settings.upsert(INSTANT_MAPS_KEY, policy);
        this.instantMapsCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.instant_maps_updated",
            entityType: "settings",
            entityId: INSTANT_MAPS_KEY,
            summary: "Instant maps policy updated",
            before: current,
            after: policy,
        });
        return policy;
    }

    async getInstantMarketplacePolicy(): Promise<InstantMarketplacePolicy> {
        if (
            this.instantMarketplaceCache &&
            Date.now() - this.instantMarketplaceCache.at < CHANNEL_CACHE_TTL_MS
        ) {
            return this.instantMarketplaceCache.policy;
        }
        const row = await this.settings.findByKey(INSTANT_MARKETPLACE_KEY);
        const policy = mergeInstantMarketplacePolicy(row?.value ?? DEFAULT_INSTANT_MARKETPLACE_POLICY);
        if (!row) {
            await this.settings.upsert(INSTANT_MARKETPLACE_KEY, policy);
        }
        this.instantMarketplaceCache = { policy, at: Date.now() };
        return policy;
    }

    async patchInstantMarketplacePolicy(
        input: PatchInstantMarketplaceInput,
        actorId: string,
    ): Promise<InstantMarketplacePolicy> {
        const current = await this.getInstantMarketplacePolicy();
        const policy = mergeInstantMarketplacePolicy({ ...current, ...input });
        await this.settings.upsert(INSTANT_MARKETPLACE_KEY, policy);
        this.instantMarketplaceCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.instant_marketplace_updated",
            entityType: "settings",
            entityId: INSTANT_MARKETPLACE_KEY,
            summary: "Instant marketplace policy updated",
            before: current,
            after: policy,
        });
        return policy;
    }

    private async loadDemoAuthPolicy(): Promise<DemoAuthPolicy> {
        if (this.demoAuthCache && Date.now() - this.demoAuthCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.demoAuthCache.policy;
        }
        const row = await this.settings.findByKey(DEMO_AUTH_KEY);
        const policy = mergeDemoAuthPolicy(row?.value ?? DEFAULT_DEMO_AUTH_POLICY);
        if (!row) {
            await this.settings.upsert(DEMO_AUTH_KEY, policy);
        }
        this.demoAuthCache = { policy, at: Date.now() };
        return policy;
    }

    async getDemoAuthPolicy(): Promise<DemoAuthPolicy> {
        return this.loadDemoAuthPolicy();
    }

    async getDemoAuthAdmin(): Promise<DemoAuthAdminView> {
        const policy = await this.loadDemoAuthPolicy();
        return toDemoAuthAdminView(policy);
    }

    async patchDemoAuthPolicy(
        input: PatchDemoAuthPolicyInput,
        actorId: string,
    ): Promise<DemoAuthAdminView> {
        const current = await this.loadDemoAuthPolicy();
        const policy = applyDemoAuthPatch(current, input);
        await this.settings.upsert(DEMO_AUTH_KEY, policy);
        this.demoAuthCache = { policy, at: Date.now() };
        await auditService.log({
            actorId,
            action: "settings.demo_auth_updated",
            entityType: "settings",
            entityId: DEMO_AUTH_KEY,
            summary: "Demo auth policy updated",
            before: current,
            after: policy,
        });
        return toDemoAuthAdminView(policy);
    }

    async getPublicInstantConfig() {
        const [dispatch, marketplace, maps] = await Promise.all([
            this.getInstantDispatchPolicy(),
            this.getInstantMarketplacePolicy(),
            this.getInstantMapsPolicy(),
        ]);
        return {
            dispatchEnabled: dispatch.enabled,
            marketplaceEnabled: marketplace.enabled,
            maps: {
                customerApp: maps.customerAppMapEnabled,
                vendorApp: maps.vendorAppMapEnabled,
                web: maps.webMapEnabled,
                liveTracking: maps.liveTrackingEnabled,
                provider: maps.provider,
            },
            ...(dispatch.enabled
                ? {
                      presence: {
                          heartbeatSec: dispatch.heartbeatSec,
                          locationMinIntervalSec: dispatch.locationMinIntervalSec,
                          locationMinMoveM: dispatch.locationMinMoveM,
                      },
                  }
                : {}),
        };
    }

    private async loadPaymentFlags(): Promise<PaymentMethodFlags> {
        if (this.payCache && Date.now() - this.payCache.at < CHANNEL_CACHE_TTL_MS) {
            return this.payCache.flags;
        }
        const row = await this.settings.findByKey(PAY_METHODS_KEY);
        const merged = mergePaymentMethods(row?.value);
        const flags = exclusiveOnlineProviders(merged);
        if (
            !row ||
            merged.razorpay !== flags.razorpay ||
            merged.cashfree !== flags.cashfree
        ) {
            await this.settings.upsert(PAY_METHODS_KEY, flags);
        }
        this.payCache = { flags, at: Date.now() };
        return flags;
    }
}
