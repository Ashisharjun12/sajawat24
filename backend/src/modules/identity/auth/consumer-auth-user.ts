import type { User } from "@/modules/identity/users/user.schema.js";

/** Deleted tombstones must not be used for login, linking, or provisioner reuse. */
export function userForAuthLookup(user: User | undefined): User | undefined {
    if (!user || user.status === "deleted") {
        return undefined;
    }
    return user;
}
