export const BOOKING_POLICY_KEY = "booking.policy";

export type BookingPolicy = {
    acceptingBookings: boolean;
    operatingHoursStart: string;
    operatingHoursEnd: string;
    minLeadHours: number;
};

export const DEFAULT_BOOKING_POLICY: BookingPolicy = {
    acceptingBookings: true,
    operatingHoursStart: "09:00",
    operatingHoursEnd: "21:00",
    minLeadHours: 2,
};

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function isValidTimeHm(value: string): boolean {
    return TIME_PATTERN.test(value);
}

export function mergeBookingPolicy(value: unknown): BookingPolicy {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const acceptingBookings =
        typeof raw.acceptingBookings === "boolean"
            ? raw.acceptingBookings
            : DEFAULT_BOOKING_POLICY.acceptingBookings;

    const operatingHoursStart =
        typeof raw.operatingHoursStart === "string" &&
        isValidTimeHm(raw.operatingHoursStart)
            ? raw.operatingHoursStart
            : DEFAULT_BOOKING_POLICY.operatingHoursStart;

    const operatingHoursEnd =
        typeof raw.operatingHoursEnd === "string" && isValidTimeHm(raw.operatingHoursEnd)
            ? raw.operatingHoursEnd
            : DEFAULT_BOOKING_POLICY.operatingHoursEnd;

    const minLeadHours =
        typeof raw.minLeadHours === "number" && raw.minLeadHours >= 0
            ? Math.min(72, Math.round(raw.minLeadHours))
            : DEFAULT_BOOKING_POLICY.minLeadHours;

    return {
        acceptingBookings,
        operatingHoursStart,
        operatingHoursEnd,
        minLeadHours,
    };
}
