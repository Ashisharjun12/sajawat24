import { ApiError } from "@/shared/errors/apiError.js";
import { normalizePhone } from "@/modules/identity/auth/phone.js";
import type { PartnerContext } from "@/modules/identity/partner/partner-context.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IUserService } from "@/modules/identity/users/user.service.js";
import type { IVendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import { auditService } from "@/modules/ops/audit/audit.service.js";
import { downgradeStaffRoleIfOrphaned } from "@/modules/identity/consumer/staff-role-lifecycle.js";
import type { ISessionService } from "@/modules/identity/sessions/session.service.js";
import type { VendorMember } from "@/modules/identity/vendor-members/vendor-member.schema.js";
import { parsePagination, type Paginated } from "@/shared/http/pagination.js";

export type PublicTeamMember = {
    id: string;
    displayName: string;
    phone: string;
    kind: "OWNER" | "WORKER";
    status: "invited" | "active" | "disabled";
    userId: string | null;
};

function toPublic(row: VendorMember): PublicTeamMember {
    return {
        id: row.id,
        displayName: row.displayName,
        phone: row.invitedPhone,
        kind: row.kind,
        status: row.status,
        userId: row.userId,
    };
}

export class VendorTeamService {
    constructor(
        private readonly members: IVendorMemberRepository,
        private readonly vendors: IVendorRepository,
        private readonly users: IUserService,
        private readonly sessions: ISessionService,
    ) {}

    private assertOwner(partner: PartnerContext) {
        if (partner.mode !== "owner" || !partner.isShopOwner) {
            throw ApiError.forbidden("owner mode required");
        }
    }

    async list(
        partner: PartnerContext,
        query: {
            page?: unknown;
            limit?: unknown;
            q?: string;
            status?: "active" | "invited" | "disabled";
        } = {},
    ): Promise<
        Paginated<PublicTeamMember> & {
            statusCounts: { all: number; active: number; invited: number; disabled: number };
        }
    > {
        this.assertOwner(partner);
        const pagination = parsePagination(query);
        const [listed, statusCounts] = await Promise.all([
            this.members.listWorkersPaginated(partner.vendorId, pagination, {
                q: query.q,
                status: query.status,
            }),
            this.members.workerStatusCounts(partner.vendorId, query.q),
        ]);
        return {
            items: listed.items.map(toPublic),
            page: pagination.page,
            limit: pagination.limit,
            total: listed.total,
            statusCounts,
        };
    }

    async invite(
        partner: PartnerContext,
        input: { phone: string; displayName: string },
    ): Promise<PublicTeamMember> {
        this.assertOwner(partner);
        const phone = normalizePhone(input.phone);
        const displayName = input.displayName.trim();

        const phoneUser = await this.users.findByPhone(phone);
        if (phoneUser?.role === "vendor") {
            const owned = await this.vendors.findByUserId(phoneUser.id);
            if (owned && owned.id !== partner.vendorId) {
                throw ApiError.conflict("phone belongs to another shop owner");
            }
        }

        const elsewhere = await this.members.findActiveMemberElsewhere(phone, partner.vendorId);
        if (elsewhere) {
            throw ApiError.conflict("phone is already staff at another shop");
        }

        const onTeam = await this.members.listForVendor(partner.vendorId);
        const duplicate = onTeam.find(
            (m) => m.invitedPhone === phone && m.status !== "disabled",
        );
        if (duplicate) {
            throw ApiError.conflict("team member already exists for this phone");
        }

        const created = await this.members.create({
            vendorId: partner.vendorId,
            invitedPhone: phone,
            displayName,
            kind: "WORKER",
            status: "invited",
        });

        await auditService.log({
            actorId: partner.userId,
            action: "vendor.member_invited",
            entityType: "vendor_member",
            entityId: created.id,
            summary: `Invited team member ${displayName}`,
            after: { phone, displayName },
        });

        return toPublic(created);
    }

    async patch(
        partner: PartnerContext,
        memberId: string,
        input: { displayName?: string; status?: "active" | "disabled" },
    ): Promise<PublicTeamMember> {
        this.assertOwner(partner);
        const member = await this.members.findByIdForVendor(partner.vendorId, memberId);
        if (!member) {
            throw ApiError.notFound("team member not found");
        }
        if (member.kind === "OWNER") {
            throw ApiError.forbidden("cannot modify shop owner membership");
        }
        const updated = await this.members.update(memberId, {
            ...(input.displayName ? { displayName: input.displayName } : {}),
            ...(input.status ? { status: input.status } : {}),
        });
        if (!updated) {
            throw ApiError.notFound("team member not found");
        }
        return toPublic(updated);
    }

    async disable(partner: PartnerContext, memberId: string): Promise<void> {
        const member = await this.members.findByIdForVendor(partner.vendorId, memberId);
        if (!member) {
            throw ApiError.notFound("team member not found");
        }
        await this.patch(partner, memberId, { status: "disabled" });
        await downgradeStaffRoleIfOrphaned(member.userId, {
            members: this.members,
            users: this.users,
            sessions: this.sessions,
        });
    }
}
