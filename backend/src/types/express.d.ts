import type { UserRole } from "../modules/identity/users/user.schema.js";
import type { PartnerContext } from "../modules/identity/partner/partner-context.js";

declare global {
    namespace Express {
        interface Request {
            actor?: {
                id: string;
                role: UserRole;
            };
            partner?: PartnerContext;
        }
        interface Response {
            err?: Error;
        }
    }
}

export {};
