import { _config } from "@/config/config.js";

export function isRateLimitEnabled(): boolean {
    const flag = _config.RATE_LIMIT_ENABLED;
    if (flag === "false" || flag === "0") return false;
    return true;
}
