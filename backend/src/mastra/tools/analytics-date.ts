const MAX_RANGE_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type DateWindow = {
    from: Date;
    to: Date;
    fromIso: string;
    toIso: string;
    clamped: boolean;
};

function parseIsoDate(value: string, field: string): Date {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        throw new Error(`Invalid ${field} date. Use ISO-8601, e.g. 2026-10-01.`);
    }
    return parsed;
}

/** Inclusive window on created_at. Caps span at 90 days. */
export function resolveAnalyticsWindow(from: string, to: string): DateWindow {
    let start = parseIsoDate(from, "from");
    let end = parseIsoDate(to, "to");
    if (start > end) {
        const swap = start;
        start = end;
        end = swap;
    }

    let clamped = false;
    const span = end.getTime() - start.getTime();
    const maxSpan = MAX_RANGE_DAYS * MS_PER_DAY;
    if (span > maxSpan) {
        start = new Date(end.getTime() - maxSpan);
        clamped = true;
    }

    return {
        from: start,
        to: end,
        fromIso: start.toISOString(),
        toIso: end.toISOString(),
        clamped,
    };
}

export function formatInrFromPaise(paise: number): string {
    const rupees = (paise / 100).toLocaleString("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    });
    return rupees;
}
