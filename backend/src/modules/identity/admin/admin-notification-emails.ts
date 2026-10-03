import { and, eq, isNotNull } from "drizzle-orm";
import { _config } from "@/config/config.js";
import { db } from "@/db/postgres-client.js";
import { users } from "@/modules/identity/users/user.schema.js";

/** Emails for system alerts to platform admins (DB accounts first, then env bootstrap). */
export async function listAdminNotificationEmails(): Promise<string[]> {
    const rows = await db
        .select({ email: users.email })
        .from(users)
        .where(and(eq(users.role, "admin"), isNotNull(users.email)));

    const emails = rows
        .map((row) => row.email?.trim().toLowerCase())
        .filter((email): email is string => Boolean(email && email.includes("@")));

    const unique = [...new Set(emails)];
    if (unique.length > 0) {
        return unique;
    }

    const fallback = _config.ADMIN_EMAIL?.trim().toLowerCase();
    return fallback && fallback.includes("@") ? [fallback] : [];
}
