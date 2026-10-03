import { UserRepository } from "@/modules/identity/users/user.repository.js";

/** Stable service account for assignment.assigned_by on auto-dispatch offers. */
export const INSTANT_DISPATCH_SYSTEM_USER_EMAIL = "instant-dispatch@system.internal.decory";

const users = new UserRepository();

export type InstantDispatchSystemUserResult = {
    systemUserId: string;
    created: boolean;
};

export async function ensureInstantDispatchSystemUser(
    preferredId?: string | null,
): Promise<InstantDispatchSystemUserResult> {
    if (preferredId) {
        const byId = await users.findById(preferredId);
        if (byId) {
            return { systemUserId: byId.id, created: false };
        }
    }

    const byEmail = await users.findByEmail(INSTANT_DISPATCH_SYSTEM_USER_EMAIL);
    if (byEmail) {
        return { systemUserId: byEmail.id, created: false };
    }

    const created = await users.create({
        name: "Instant dispatch (system)",
        email: INSTANT_DISPATCH_SYSTEM_USER_EMAIL,
        role: "user",
        status: "active",
    });

    return { systemUserId: created.id, created: true };
}
