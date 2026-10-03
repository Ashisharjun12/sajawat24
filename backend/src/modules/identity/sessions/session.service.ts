import { createHash, randomBytes, randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { ISessionRepository } from "@/modules/identity/sessions/session.repository.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";
import type { User, UserRole } from "@/modules/identity/users/user.schema.js";

export type ClientType = "web" | "mobile";
export type Device = "web" | "ios" | "android";

export type AuthTokens = {
    accessToken: string;
    refreshToken: string;
};

function jwtSecret(): string {
    if (!_config.JWT_SECRET) {
        throw new Error("JWT_SECRET is missing from environment");
    }
    return _config.JWT_SECRET;
}

export function hashRefreshToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

export function resolveDevice(clientType: ClientType, device?: Device): Device {
    if (clientType === "web") return "web";
    return device ?? "android";
}

export function signAccessToken(user: Pick<User, "id" | "role">): string {
    return jwt.sign({ sub: user.id, role: user.role }, jwtSecret(), { expiresIn: "15m" });
}

export function verifyAccessToken(token: string): { sub: string; role: UserRole } {
    try {
        const payload = jwt.verify(token, jwtSecret()) as { sub?: string; role?: UserRole };
        if (!payload.sub || !payload.role) {
            throw ApiError.unauthorized("invalid access token");
        }
        return { sub: payload.sub, role: payload.role };
    } catch (err) {
        if (err instanceof ApiError) throw err;
        throw ApiError.unauthorized("invalid or expired access token");
    }
}

export interface ISessionService {
    issue(user: User, device: Device, familyId?: string): Promise<AuthTokens>;
    rotate(incomingRefreshToken: string, device: Device): Promise<{ user: User; tokens: AuthTokens }>;
    revoke(incomingRefreshToken: string): Promise<void>;
    revokeAllForUser(userId: string): Promise<void>;
}

export class SessionService implements ISessionService {
    constructor(
        private readonly sessions: ISessionRepository,
        private readonly users: IUserRepository,
    ) {}

    async issue(user: User, device: Device, familyId?: string): Promise<AuthTokens> {
        if (user.status === "blocked") {
            throw ApiError.forbidden("account blocked");
        }

        const accessToken = signAccessToken(user);
        const refreshToken = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        await this.sessions.insert({
            userId: user.id,
            familyId: familyId ?? randomUUID(),
            tokenHash: hashRefreshToken(refreshToken),
            device,
            expiresAt,
        });

        return { accessToken, refreshToken };
    }

    async rotate(incomingRefreshToken: string, device: Device): Promise<{ user: User; tokens: AuthTokens }> {
        const hash = hashRefreshToken(incomingRefreshToken);
        const stored = await this.sessions.revokeActiveByHash(hash);

        if (!stored) {
            const reused = await this.sessions.findByHash(hash);
            if (reused) {
                await this.sessions.revokeAllForFamily(reused.familyId);
            }
            throw ApiError.unauthorized("invalid or expired refresh token");
        }

        const user = await this.users.findById(stored.userId);
        if (!user) {
            throw ApiError.unauthorized("invalid refresh token");
        }

        const tokens = await this.issue(user, device, stored.familyId);
        return { user, tokens };
    }

    async revoke(incomingRefreshToken: string): Promise<void> {
        await this.sessions.revokeActiveByHash(hashRefreshToken(incomingRefreshToken));
    }

    async revokeAllForUser(userId: string): Promise<void> {
        await this.sessions.revokeAllForUser(userId);
    }
}
