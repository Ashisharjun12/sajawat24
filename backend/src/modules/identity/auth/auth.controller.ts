import type { CookieOptions, Request, Response } from "express";
import { _config } from "@/config/config.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { IAuthService, PublicUser } from "@/modules/identity/auth/auth.service.js";
import type { AuthTokens, ClientType } from "@/modules/identity/sessions/session.service.js";

const REFRESH_COOKIE = "refreshToken";

function refreshCookieOptions(): CookieOptions {
    return {
        httpOnly: true,
        secure: _config.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: "/",
    };
}

function sendAuth(
    res: Response,
    clientType: ClientType,
    payload: { user: PublicUser; tokens: AuthTokens },
    message: string,
) {
    res.cookie(REFRESH_COOKIE, payload.tokens.refreshToken, refreshCookieOptions());
    const data: Record<string, unknown> = {
        accessToken: payload.tokens.accessToken,
        user: payload.user,
    };
    if (clientType === "mobile") {
        data.refreshToken = payload.tokens.refreshToken;
    }
    res.status(200).json(new ApiResponse(200, data, message));
}

function incomingRefresh(req: Request): string | undefined {
    const cookie = req.cookies?.refreshToken as string | undefined;
    const body = req.body?.refreshToken as string | undefined;
    return cookie || body;
}

function clientIp(req: Request): string | undefined {
    return req.ip || req.socket.remoteAddress;
}

export class AuthController {
    constructor(private readonly authService: IAuthService) {}

    requestOtp = asyncHandler(async (req, res) => {
        const data = await this.authService.requestOtp(
            req.body.phone,
            clientIp(req),
            req.body.androidAppHash,
            req.body.loginIntent,
        );
        res.status(200).json(new ApiResponse(200, data, "otp sent"));
    });

    verifyOtp = asyncHandler(async (req, res) => {
        const result = await this.authService.verifyOtp(req.body);
        sendAuth(res, req.body.clientType, result, "logged in");
    });

    google = asyncHandler(async (req, res) => {
        const result = await this.authService.googleLogin(req.body);
        sendAuth(res, req.body.clientType, result, "logged in");
    });

    adminLogin = asyncHandler(async (req, res) => {
        const result = await this.authService.adminLogin(req.body);
        sendAuth(res, req.body.clientType ?? "web", result, "logged in");
    });

    refresh = asyncHandler(async (req, res) => {
        const refreshToken = incomingRefresh(req);
        if (!refreshToken) {
            throw ApiError.unauthorized("No refresh token");
        }
        const clientType = (req.body?.clientType as ClientType | undefined) ?? "web";
        const result = await this.authService.refresh({
            refreshToken,
            clientType,
            device: req.body?.device,
        });
        sendAuth(res, clientType, result, "token refreshed");
    });

    logout = asyncHandler(async (req, res) => {
        const refreshToken = incomingRefresh(req);
        if (!refreshToken) {
            throw ApiError.unauthorized("No refresh token");
        }
        await this.authService.logout(refreshToken);
        res.clearCookie(REFRESH_COOKIE, { ...refreshCookieOptions(), maxAge: 0 });
        res.status(200).json(new ApiResponse(200, null, "logged out"));
    });

    me = asyncHandler(async (req, res) => {
        const data = await this.authService.me(req.actor!.id);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });
}
