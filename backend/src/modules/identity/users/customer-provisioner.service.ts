import { ApiError } from "@/shared/errors/apiError.js";
import { normalizePhone } from "@/modules/identity/auth/phone.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { User } from "@/modules/identity/users/user.schema.js";

export type AdminBookingCustomerInput = {
    phone: string;
    name: string;
    email?: string;
};

const GENERIC_NAMES = new Set(["user", ""]);

export class CustomerProvisioner {
    constructor(private readonly users: IUserRepository) {}

    toOrderPhone(phoneRaw: string): string {
        return normalizePhone(phoneRaw).slice(3);
    }

    async findOrCreateForAdminBooking(input: AdminBookingCustomerInput): Promise<User> {
        const phone = normalizePhone(input.phone);
        const name = input.name.trim();
        const email = input.email?.trim().toLowerCase() || undefined;

        const existing = await this.users.findByPhone(phone);
        if (existing) {
            if (existing.role !== "user") {
                throw ApiError.conflict("phone already registered");
            }
            if (!existing.phoneVerifiedAt) {
                await this.users.markPhoneVerified(existing.id);
            }
            if (GENERIC_NAMES.has(existing.name.trim().toLowerCase()) && name.length >= 2) {
                await this.users.updateName(existing.id, name);
            }
            if (email && !existing.email) {
                const byEmail = await this.users.findByEmail(email);
                if (byEmail && byEmail.id !== existing.id) {
                    throw ApiError.conflict("email already registered");
                }
                return this.users.setEmail(existing.id, email);
            }
            return (await this.users.findById(existing.id)) ?? existing;
        }

        if (email) {
            const byEmail = await this.users.findByEmail(email);
            if (byEmail) {
                throw ApiError.conflict("email already registered");
            }
        }

        return this.users.create({
            phone,
            name,
            email: email ?? null,
            role: "user",
            phoneVerifiedAt: new Date(),
        });
    }
}
