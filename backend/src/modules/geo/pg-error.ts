function pgCode(err: unknown, code: string): boolean {
    let current: unknown = err;
    for (let i = 0; i < 5 && current; i++) {
        if (typeof current === "object" && current !== null && "code" in current) {
            if ((current as { code?: string }).code === code) {
                return true;
            }
        }
        current =
            typeof current === "object" && current !== null && "cause" in current
                ? (current as { cause?: unknown }).cause
                : undefined;
    }
    return false;
}

export function isUniqueViolation(err: unknown): boolean {
    return pgCode(err, "23505");
}

export function isForeignKeyViolation(err: unknown): boolean {
    return pgCode(err, "23503");
}
