import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getActiveCityById } from "@/modules/geo/index.js";
import type { IMediaService } from "@/modules/upload/media/media.service.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import { normalizePhone } from "@/modules/identity/auth/phone.js";
import type {
    VendorRegisterInput,
    VendorReapplyInput,
    VendorProfilePatchInput,
    AdminVendorListQuery,
} from "@/modules/identity/vendors/vendor.dto.js";
import type {
    AdminVendorDetail,
    AdminVendorListItem,
    PublicVendorProfile,
} from "@/modules/identity/vendors/vendor.public.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { NewVendor, Vendor, VendorOnboardingStatus } from "@/modules/identity/vendors/vendor.schema.js";
import type { User } from "@/modules/identity/users/user.schema.js";
import type { IUserService } from "@/modules/identity/users/user.service.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { ISessionService } from "@/modules/identity/sessions/session.service.js";
import { downgradeStaffRoleIfOrphaned } from "@/modules/identity/consumer/staff-role-lifecycle.js";

export interface IVendorService {
    findByUserId(userId: string): Promise<Vendor | undefined>;
    findPublicProfileByUserId(userId: string): Promise<PublicVendorProfile | undefined>;
    create(data: NewVendor): Promise<Vendor>;
    createWithUser(input: VendorRegisterInput & { phone: string }): Promise<User>;
    validateRegisterInput(input: VendorRegisterInput): Promise<VendorRegisterInput & { phone: string }>;
    presignShopImage(input: {
        phone: string;
        fileName: string;
        contentType: string;
    }): Promise<{ uploadId: string; uploadUrl: string; publicUrl: string }>;
    completeShopImage(uploadId: string): Promise<{ uploadId: string; publicUrl: string }>;
    listAdmin(query: AdminVendorListQuery): Promise<{
        items: AdminVendorListItem[];
        page: number;
        limit: number;
        total: number;
    }>;
    getAdminDetail(id: string): Promise<AdminVendorDetail>;
    updateOnboardingStatus(
        id: string,
        status: VendorOnboardingStatus,
        actorId: string,
    ): Promise<AdminVendorDetail>;
    listTeamWorkersAdmin(
        vendorId: string,
        query: {
            page?: unknown;
            limit?: unknown;
            q?: string;
            status?: "active" | "invited" | "disabled";
        },
    ): Promise<{
        items: Array<{
            id: string;
            displayName: string;
            phone: string;
            kind: string;
            status: string;
            userId: string | null;
        }>;
        page: number;
        limit: number;
        total: number;
        statusCounts: { all: number; active: number; invited: number; disabled: number };
    }>;
    getDuty(userId: string): Promise<PublicVendorProfile>;
    getShopDutyByVendorId(vendorId: string): Promise<PublicVendorProfile>;
    setDuty(userId: string, isOnDuty: boolean): Promise<PublicVendorProfile>;
    reapply(userId: string, input: VendorReapplyInput): Promise<void>;
    presignProfileAvatar(
        userId: string,
        input: { fileName: string; contentType: string },
    ): Promise<{ uploadId: string; uploadUrl: string; publicUrl: string }>;
    completeProfileAvatar(uploadId: string): Promise<{ uploadId: string; publicUrl: string }>;
    patchProfile(userId: string, input: VendorProfilePatchInput): Promise<User>;
}

export class VendorService implements IVendorService {
    private readonly members = new VendorMemberRepository();

    constructor(
        private readonly vendors: IVendorRepository,
        private readonly media: IMediaService,
        private readonly users: IUserService,
        private readonly sessions: ISessionService,
    ) {}

    findByUserId(userId: string) {
        return this.vendors.findByUserId(userId);
    }

    findPublicProfileByUserId(userId: string) {
        return this.vendors.findPublicProfileByUserId(userId);
    }

    create(data: NewVendor) {
        return this.vendors.create(data);
    }

    private normalizeAltPhone(altPhone?: string): string | undefined {
        if (!altPhone) return undefined;
        return normalizePhone(altPhone);
    }

    async validateRegisterInput(input: VendorRegisterInput) {
        const phone = normalizePhone(input.phone);
        await getActiveCityById(input.cityId);

        if (input.shopImageUploadId) {
            await this.media.getCompleted(input.shopImageUploadId);
        }

        return {
            ...input,
            phone,
            altPhone: this.normalizeAltPhone(input.altPhone),
        };
    }

    async createWithUser(input: VendorRegisterInput & { phone: string }) {
        const validated = await this.validateRegisterInput(input);
        return this.vendors.createWithUser({
            phone: validated.phone,
            name: validated.name,
            email: validated.email,
            altPhone: validated.altPhone,
            cityId: validated.cityId,
            shopAddress: validated.shopAddress,
            pincode: validated.pincode,
            shopImageUploadId: validated.shopImageUploadId,
            baseLatitude: validated.baseLatitude ?? null,
            baseLongitude: validated.baseLongitude ?? null,
            baseGeoSource: validated.baseGeoSource ?? null,
        });
    }

    async presignShopImage(input: { phone: string; fileName: string; contentType: string }) {
        normalizePhone(input.phone);
        const result = await this.media.presign({
            filename: input.fileName,
            mimeType: input.contentType,
            kind: "image",
            uploadedBy: null,
        });
        if (result.uploadMode !== "direct") {
            throw ApiError.internalServerError("direct upload is required for vendor onboarding");
        }
        return {
            uploadId: result.id,
            uploadUrl: result.uploadUrl,
            publicUrl: result.publicUrl,
        };
    }

    async completeShopImage(uploadId: string) {
        const media = await this.media.complete(uploadId);
        return {
            uploadId: media.id,
            publicUrl: media.publicUrl,
        };
    }

    async listAdmin(query: AdminVendorListQuery) {
        const pagination = parsePagination(query);
        const result = await this.vendors.listAdmin({
            page: pagination.page,
            limit: pagination.limit,
            status: query.status,
            search: query.search,
            cityId: query.cityId,
            isOnDuty: query.isOnDuty,
            joinedFrom: query.joinedFrom,
            joinedTo: query.joinedTo,
        });
        return {
            items: result.items,
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async getAdminDetail(id: string) {
        const vendor = await this.vendors.findAdminDetail(id);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }
        return vendor;
    }

    async updateOnboardingStatus(
        id: string,
        status: VendorOnboardingStatus,
        actorId: string,
    ) {
        const existing = await this.vendors.findAdminDetail(id);
        if (!existing) {
            throw ApiError.notFound("vendor not found");
        }
        if (existing.onboardingStatus === status) {
            return existing;
        }
        const updated = await this.vendors.updateOnboardingStatus(id, status);
        if (!updated) {
            throw ApiError.notFound("vendor not found");
        }
        if (status === "BLOCKED" || status === "REJECTED") {
            const disabledWorkers = await this.members.disableAllWorkersForVendor(id);
            const staffUserIds = new Set(
                disabledWorkers.map((row) => row.userId).filter((uid): uid is string => Boolean(uid)),
            );
            for (const staffUserId of staffUserIds) {
                await downgradeStaffRoleIfOrphaned(staffUserId, {
                    members: this.members,
                    users: this.users,
                    sessions: this.sessions,
                });
            }
        } else if (status === "ACTIVE") {
            if (existing.phone) {
                await this.members.upsertOwnerForVendor({
                    vendorId: id,
                    userId: existing.userId,
                    invitedPhone: existing.phone,
                    displayName: existing.name,
                });
            }
        }

        await auditService.log({
            actorId,
            action: "vendor.status_changed",
            entityType: "vendor",
            entityId: id,
            summary: `Vendor ${existing.name} status changed to ${status}`,
            before: { onboardingStatus: existing.onboardingStatus },
            after: { onboardingStatus: status },
        });

        return this.getAdminDetail(id);
    }

    async getDuty(userId: string): Promise<PublicVendorProfile> {
        const profile = await this.vendors.findPublicProfileByUserId(userId);
        if (!profile) {
            throw ApiError.notFound("vendor not found");
        }
        return profile;
    }

    async getShopDutyByVendorId(vendorId: string): Promise<PublicVendorProfile> {
        const vendor = await this.vendors.findById(vendorId);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }
        const profile = await this.vendors.findPublicProfileByUserId(vendor.userId);
        if (!profile) {
            throw ApiError.notFound("vendor not found");
        }
        return profile;
    }

    async setDuty(userId: string, isOnDuty: boolean): Promise<PublicVendorProfile> {
        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }

        if (vendor.onboardingStatus !== "ACTIVE") {
            const messages: Record<string, string> = {
                PENDING: "vendor account is pending approval",
                REJECTED: "vendor account is rejected",
                BLOCKED: "vendor account is blocked",
            };
            throw ApiError.forbidden(messages[vendor.onboardingStatus] ?? "vendor account is not active");
        }

        if (vendor.isOnDuty === isOnDuty) {
            const profile = await this.vendors.findPublicProfileByUserId(userId);
            if (!profile) {
                throw ApiError.notFound("vendor not found");
            }
            return profile;
        }

        const updated = await this.vendors.updateDuty(vendor.id, isOnDuty);
        if (!updated) {
            throw ApiError.notFound("vendor not found");
        }

        if (!isOnDuty && vendor.cityId) {
            const { geoRemoveVendorOnline } = await import(
                "@/modules/dispatch/geo/vendor-geo.store.js"
            );
            await geoRemoveVendorOnline(vendor.cityId, vendor.id);
        }

        const profile = await this.vendors.findPublicProfileByUserId(userId);
        if (!profile) {
            throw ApiError.notFound("vendor not found");
        }
        return profile;
    }

    async reapply(userId: string, input: VendorReapplyInput) {
        const user = await this.users.findById(userId);
        if (!user || user.role !== "vendor") {
            throw ApiError.forbidden("vendor account required");
        }

        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }
        if (vendor.onboardingStatus !== "REJECTED") {
            throw ApiError.badRequest("reapply is only allowed for rejected applications");
        }

        await getActiveCityById(input.cityId);

        if (input.shopImageUploadId) {
            await this.media.getCompleted(input.shopImageUploadId);
        }

        const email = input.email.trim().toLowerCase();
        const existingEmail = await this.users.findByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
            throw ApiError.conflict("email already registered");
        }

        const altPhone = this.normalizeAltPhone(input.altPhone);

        await this.users.updateProfile(userId, {
            name: input.name.trim(),
            email,
        });

        const updated = await this.vendors.updateProfile(vendor.id, {
            cityId: input.cityId,
            shopAddress: input.shopAddress.trim(),
            pincode: input.pincode,
            altPhone: altPhone ?? null,
            shopImageUploadId: input.shopImageUploadId ?? vendor.shopImageUploadId ?? null,
            baseLatitude: input.baseLatitude ?? null,
            baseLongitude: input.baseLongitude ?? null,
            baseGeoSource: input.baseGeoSource ?? null,
            onboardingStatus: "PENDING",
        });

        if (!updated) {
            throw ApiError.notFound("vendor not found");
        }
    }

    async presignProfileAvatar(
        userId: string,
        input: { fileName: string; contentType: string },
    ) {
        const user = await this.users.findById(userId);
        if (!user || user.role !== "vendor") {
            throw ApiError.forbidden("vendor account required");
        }

        const result = await this.media.presign({
            filename: input.fileName,
            mimeType: input.contentType,
            kind: "image",
            uploadedBy: userId,
        });
        if (result.uploadMode !== "direct") {
            throw ApiError.internalServerError("direct upload is required for profile avatars");
        }
        return {
            uploadId: result.id,
            uploadUrl: result.uploadUrl,
            publicUrl: result.publicUrl,
        };
    }

    async completeProfileAvatar(uploadId: string) {
        const media = await this.media.complete(uploadId);
        return {
            uploadId: media.id,
            publicUrl: media.publicUrl,
        };
    }

    async patchProfile(userId: string, input: VendorProfilePatchInput) {
        const user = await this.users.findById(userId);
        if (!user || user.role !== "vendor") {
            throw ApiError.forbidden("vendor account required");
        }

        const vendor = await this.vendors.findByUserId(userId);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }

        const email = input.email.trim().toLowerCase();
        const existingEmail = await this.users.findByEmail(email);
        if (existingEmail && existingEmail.id !== userId) {
            throw ApiError.conflict("email already registered");
        }

        if (input.avatarUploadId) {
            const media = await this.media.getCompleted(input.avatarUploadId);
            await this.users.setAvatar(userId, displayUrl(media));
        }

        return this.users.updateProfile(userId, {
            name: input.name.trim(),
            email,
        });
    }

    async listTeamWorkersAdmin(
        vendorId: string,
        query: {
            page?: unknown;
            limit?: unknown;
            q?: string;
            status?: "active" | "invited" | "disabled";
        },
    ) {
        const vendor = await this.vendors.findById(vendorId);
        if (!vendor) {
            throw ApiError.notFound("vendor not found");
        }
        const pagination = parsePagination(query);
        const [listed, statusCounts] = await Promise.all([
            this.members.listWorkersPaginated(vendorId, pagination, {
                q: query.q,
                status: query.status,
            }),
            this.members.workerStatusCounts(vendorId, query.q),
        ]);
        return {
            items: listed.items.map((row) => ({
                id: row.id,
                displayName: row.displayName,
                phone: row.invitedPhone,
                kind: row.kind,
                status: row.status,
                userId: row.userId,
            })),
            page: pagination.page,
            limit: pagination.limit,
            total: listed.total,
            statusCounts,
        };
    }
}
