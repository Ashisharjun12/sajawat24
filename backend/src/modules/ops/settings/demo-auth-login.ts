/** Shared helpers for login OTP request responses (demo + standard). */

export type OtpRequestPayload = {
    phone: string;
    otp?: string;
};

export function buildOtpRequestPayload(
    phone: string,
    otp: string,
    includeOtpInResponse: boolean,
): OtpRequestPayload {
    if (!includeOtpInResponse) {
        return { phone };
    }
    return { phone, otp };
}
