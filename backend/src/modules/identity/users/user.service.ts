import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { NewUser, User, UserRole, UserStatus } from "@/modules/identity/users/user.schema.js";

export interface IUserService {
    findById(id: string): Promise<User | undefined>;
    findByPhone(phone: string): Promise<User | undefined>;
    findByEmail(email: string): Promise<User | undefined>;
    findByGoogleId(googleId: string): Promise<User | undefined>;
    create(data: NewUser): Promise<User>;
    markPhoneVerified(id: string): Promise<void>;
    linkGoogleId(id: string, googleId: string): Promise<User>;
    linkPhone(id: string, phone: string): Promise<User>;
    linkGoogleProfile(
        id: string,
        input: { googleId: string; email?: string | null; avatar?: string | null },
    ): Promise<User>;
    setAvatar(id: string, avatar: string): Promise<User>;
    updateProfile(id: string, input: { name: string; email: string }): Promise<User>;
    updateStatus(id: string, status: UserStatus): Promise<User>;
    updateRole(id: string, role: UserRole): Promise<User>;
    updateName(id: string, name: string): Promise<void>;
    countByRole(role: UserRole): Promise<number>;
    updatePasswordHash(id: string, passwordHash: string): Promise<void>;
    setMustChangePassword(id: string, value: boolean): Promise<void>;
    setEmail(id: string, email: string): Promise<User>;
}

export class UserService implements IUserService {
    constructor(private readonly users: IUserRepository) {}

    findById(id: string) {
        return this.users.findById(id);
    }

    findByPhone(phone: string) {
        return this.users.findByPhone(phone);
    }

    findByEmail(email: string) {
        return this.users.findByEmail(email);
    }

    findByGoogleId(googleId: string) {
        return this.users.findByGoogleId(googleId);
    }

    create(data: NewUser) {
        return this.users.create(data);
    }

    markPhoneVerified(id: string) {
        return this.users.markPhoneVerified(id);
    }

    linkGoogleId(id: string, googleId: string) {
        return this.users.linkGoogleId(id, googleId);
    }

    linkPhone(id: string, phone: string) {
        return this.users.linkPhone(id, phone);
    }

    linkGoogleProfile(
        id: string,
        input: { googleId: string; email?: string | null; avatar?: string | null },
    ) {
        return this.users.linkGoogleProfile(id, input);
    }

    setAvatar(id: string, avatar: string) {
        return this.users.setAvatar(id, avatar);
    }

    updateProfile(id: string, input: { name: string; email: string }) {
        return this.users.updateProfile(id, input);
    }

    updateStatus(id: string, status: UserStatus) {
        return this.users.updateStatus(id, status);
    }

    updateRole(id: string, role: UserRole) {
        return this.users.updateRole(id, role);
    }

    updateName(id: string, name: string) {
        return this.users.updateName(id, name);
    }

    countByRole(role: UserRole) {
        return this.users.countByRole(role);
    }

    updatePasswordHash(id: string, passwordHash: string) {
        return this.users.updatePasswordHash(id, passwordHash);
    }

    setMustChangePassword(id: string, value: boolean) {
        return this.users.setMustChangePassword(id, value);
    }

    setEmail(id: string, email: string) {
        return this.users.setEmail(id, email);
    }
}
