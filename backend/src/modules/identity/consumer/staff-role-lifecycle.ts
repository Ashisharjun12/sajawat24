import type { IUserService } from "@/modules/identity/users/user.service.js";
import type { IVendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { ISessionService } from "@/modules/identity/sessions/session.service.js";

/** After staff loses their last active shop membership, revert role for consumer app. */
export async function downgradeStaffRoleIfOrphaned(
    userId: string | null | undefined,
    deps: {
        members: IVendorMemberRepository;
        users: IUserService;
        sessions?: ISessionService;
    },
): Promise<void> {
    if (!userId) {
        return;
    }
    const user = await deps.users.findById(userId);
    if (!user || user.role !== "vendor_staff") {
        return;
    }
    const activeCount = await deps.members.countActiveMembershipsForUser(userId);
    if (activeCount > 0) {
        return;
    }
    await deps.users.updateRole(userId, "user");
    if (deps.sessions) {
        await deps.sessions.revokeAllForUser(userId);
    }
}
