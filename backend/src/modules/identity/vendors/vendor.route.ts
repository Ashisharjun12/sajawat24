import { Router } from "express";
import type { VendorAdminController, VendorController } from "@/modules/identity/vendors/vendor.controller.js";
import {
    adminVendorIdParamsDto,
    adminVendorListQueryDto,
    adminVendorMembersQueryDto,
    adminVendorPatchDto,
    vendorCompleteShopImageParamsDto,
    vendorPresignShopImageDto,
    vendorPresignAvatarDto,
    vendorCompleteAvatarParamsDto,
    vendorProfilePatchDto,
    vendorDutyPatchDto,
    vendorReapplyDto,
    vendorRegisterDto,
} from "@/modules/identity/vendors/vendor.dto.js";
import {
    completeVendorJobDto,
    vendorJobOrderParamsDto,
    vendorJobsQueryDto,
} from "@/modules/assignment/jobs/vendor-job.dto.js";
import {
    vendorJobLocationDto,
    vendorPresenceDto,
} from "@/modules/dispatch/presence/vendor-presence.dto.js";
import type { VendorPresenceController } from "@/modules/dispatch/presence/vendor-presence.controller.js";
import {
    registerPushDeviceDto,
    unregisterPushDeviceDto,
    vendorNotificationIdParamsDto,
    vendorNotificationsQueryDto,
} from "@/modules/notifications/devices/device.dto.js";
import type { VendorJobController } from "@/modules/assignment/jobs/vendor-job.controller.js";
import type { CollectionController } from "@/modules/payments/collections/collection.controller.js";
import type { PayoutMethodController } from "@/modules/payments/payout-methods/payout-method.controller.js";
import { createPayoutMethodRouter } from "@/modules/payments/payout-methods/payout-method.route.js";
import type { WalletController } from "@/modules/payments/wallets/wallet.controller.js";
import { createWalletRouter } from "@/modules/payments/wallets/wallet.route.js";
import type { VendorNotificationController } from "@/modules/notifications/vendor-notification.controller.js";
import type { VendorTeamController } from "@/modules/identity/vendor-members/vendor-team.controller.js";
import {
    inviteTeamMemberDto,
    listTeamQueryDto,
    patchTeamMemberDto,
    putJobAssignmentsDto,
    teamMemberIdParamsDto,
} from "@/modules/identity/vendor-members/vendor-team.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { requireRole } from "@/shared/middlewares/requireRole.middleware.js";
import {
    attachPartnerContext,
    requireOwnerMode,
    requirePartnerRole,
} from "@/shared/middlewares/partner.middleware.js";

export function createVendorRouter(
    vendorController: VendorController,
    vendorNotificationController: VendorNotificationController,
    vendorJobController: VendorJobController,
    collectionController: CollectionController,
    walletController: WalletController,
    payoutMethodController: PayoutMethodController,
    vendorTeamController: VendorTeamController,
    vendorPresenceController: VendorPresenceController,
) {
    const router = Router();
    const partner = [authRequired, requirePartnerRole, attachPartnerContext];
    const owner = [...partner, requireOwnerMode];

    router.post(
        "/register/presign-shop-image",
        validate(vendorPresignShopImageDto),
        vendorController.presignShopImage,
    );
    router.post(
        "/register/complete-shop-image/:uploadId",
        validate(vendorCompleteShopImageParamsDto, "params"),
        vendorController.completeShopImage,
    );
    router.post("/register", validate(vendorRegisterDto), vendorController.register);
    router.post(
        "/reapply",
        authRequired,
        requireRole("vendor"),
        validate(vendorReapplyDto),
        vendorController.reapply,
    );
    router.get("/duty", authRequired, requireRole("vendor"), vendorController.getDuty);
    router.get("/shop-duty", ...partner, vendorController.getShopDuty);
    router.patch(
        "/duty",
        authRequired,
        requireRole("vendor"),
        validate(vendorDutyPatchDto),
        vendorController.setDuty,
    );
    router.post(
        "/presence",
        ...partner,
        validate(vendorPresenceDto),
        vendorPresenceController.postPresence,
    );
    router.post("/presence/heartbeat", ...partner, vendorPresenceController.postHeartbeat);
    router.post(
        "/profile/presign-avatar",
        authRequired,
        requireRole("vendor"),
        validate(vendorPresignAvatarDto),
        vendorController.presignProfileAvatar,
    );
    router.post(
        "/profile/complete-avatar/:uploadId",
        authRequired,
        requireRole("vendor"),
        validate(vendorCompleteAvatarParamsDto, "params"),
        vendorController.completeProfileAvatar,
    );
    router.patch(
        "/profile",
        authRequired,
        requireRole("vendor"),
        validate(vendorProfilePatchDto),
        vendorController.patchProfile,
    );
    router.post(
        "/devices",
        ...partner,
        validate(registerPushDeviceDto),
        vendorNotificationController.registerDevice,
    );
    router.delete(
        "/devices",
        ...partner,
        validate(unregisterPushDeviceDto),
        vendorNotificationController.unregisterDevice,
    );
    router.get(
        "/notifications",
        ...partner,
        validate(vendorNotificationsQueryDto, "query"),
        vendorNotificationController.listInbox,
    );
    router.patch(
        "/notifications/read-all",
        ...partner,
        vendorNotificationController.markAllRead,
    );
    router.patch(
        "/notifications/:id/read",
        ...partner,
        validate(vendorNotificationIdParamsDto, "params"),
        vendorNotificationController.markRead,
    );
    router.get("/team", ...owner, validate(listTeamQueryDto, "query"), vendorTeamController.list);
    router.post("/team", ...owner, validate(inviteTeamMemberDto), vendorTeamController.invite);
    router.patch(
        "/team/:memberId",
        ...owner,
        validate(teamMemberIdParamsDto, "params"),
        validate(patchTeamMemberDto),
        vendorTeamController.patch,
    );
    router.delete(
        "/team/:memberId",
        ...owner,
        validate(teamMemberIdParamsDto, "params"),
        vendorTeamController.disable,
    );
    router.get(
        "/jobs",
        ...partner,
        validate(vendorJobsQueryDto, "query"),
        vendorJobController.list,
    );
    router.get(
        "/jobs/:orderId",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.get,
    );
    router.get(
        "/jobs/:orderId/route",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.getRoute,
    );
    router.get(
        "/jobs/:orderId/tracking",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.getTracking,
    );
    router.get(
        "/jobs/:orderId/assignments",
        ...owner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.listAssignments,
    );
    router.put(
        "/jobs/:orderId/assignments",
        ...owner,
        validate(vendorJobOrderParamsDto, "params"),
        validate(putJobAssignmentsDto),
        vendorJobController.setAssignments,
    );
    router.post(
        "/jobs/:orderId/assignments/self",
        ...owner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.assignSelf,
    );
    router.post(
        "/jobs/:orderId/accept",
        ...owner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.accept,
    );
    router.post(
        "/jobs/:orderId/decline",
        ...owner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.decline,
    );
    router.post(
        "/jobs/:orderId/location",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        validate(vendorJobLocationDto),
        vendorJobController.postLocation,
    );
    router.post(
        "/jobs/:orderId/en-route",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.markEnRoute,
    );
    router.post(
        "/jobs/:orderId/on-site",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.markOnSite,
    );
    router.post(
        "/jobs/:orderId/send-delivery-code",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        vendorJobController.sendDeliveryCode,
    );
    router.post(
        "/jobs/:orderId/complete",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        validate(completeVendorJobDto),
        vendorJobController.complete,
    );
    router.get(
        "/jobs/:orderId/collect/status",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        collectionController.status,
    );
    router.post(
        "/jobs/:orderId/collect/cash",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        collectionController.collectCash,
    );
    router.post(
        "/jobs/:orderId/collect/online",
        ...partner,
        validate(vendorJobOrderParamsDto, "params"),
        collectionController.collectOnline,
    );
    router.use("/wallet", ...owner, createWalletRouter(walletController));
    router.use("/payout-methods", ...owner, createPayoutMethodRouter(payoutMethodController));
    return router;
}

export function createVendorAdminRouter(vendorAdminController: VendorAdminController) {
    const router = Router();
    router.get("/", validate(adminVendorListQueryDto, "query"), vendorAdminController.list);
    router.get(
        "/:id/members",
        validate(adminVendorIdParamsDto, "params"),
        validate(adminVendorMembersQueryDto, "query"),
        vendorAdminController.listMembers,
    );
    router.get("/:id", validate(adminVendorIdParamsDto, "params"), vendorAdminController.get);
    router.patch(
        "/:id",
        validate(adminVendorIdParamsDto, "params"),
        validate(adminVendorPatchDto),
        vendorAdminController.patch,
    );
    return router;
}
