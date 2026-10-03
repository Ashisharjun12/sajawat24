
export function isAiInfrastructureEnabled(): boolean {
    const flag = process.env.AI_ENABLED?.trim().toLowerCase();
    if (flag === "false" || flag === "0" || flag === "no") {
        return false;
    }
    if (flag === "true" || flag === "1" || flag === "yes") {
        return Boolean(process.env.AI_DATABASE_URL?.trim());
    }
    return Boolean(process.env.AI_DATABASE_URL?.trim());
}
