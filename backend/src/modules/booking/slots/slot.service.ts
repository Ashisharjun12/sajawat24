import { ApiError } from "@/shared/errors/apiError.js";
import type { BookingPolicy } from "@/modules/ops/settings/booking-policy.js";
import { DEFAULT_BOOKING_POLICY } from "@/modules/ops/settings/booking-policy.js";

const IST_TIMEZONE = "Asia/Kolkata";

/** @deprecated use policy minLeadHours */
export const MIN_LEAD_MS = DEFAULT_BOOKING_POLICY.minLeadHours * 60 * 60 * 1000;

export function assertAcceptingBookings(policy: BookingPolicy): void {
    if (!policy.acceptingBookings) {
        throw ApiError.badRequest("new bookings are temporarily paused");
    }
}

function minutesFromHm(hm: string): number {
    const [hours, minutes] = hm.split(":").map(Number);
    return hours * 60 + minutes;
}

function slotMinutesInIst(scheduledAt: Date): number {
    const parts = new Intl.DateTimeFormat("en-GB", {
        timeZone: IST_TIMEZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).formatToParts(scheduledAt);

    const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
    const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
    return hour * 60 + minute;
}

export function assertWithinOperatingHours(
    scheduledAt: Date,
    policy: BookingPolicy = DEFAULT_BOOKING_POLICY,
): void {
    const start = minutesFromHm(policy.operatingHoursStart);
    const end = minutesFromHm(policy.operatingHoursEnd);
    const slot = slotMinutesInIst(scheduledAt);

    if (start === end) {
        return;
    }

    if (start < end) {
        if (slot < start || slot >= end) {
            throw ApiError.badRequest(
                `bookings are only accepted between ${policy.operatingHoursStart} and ${policy.operatingHoursEnd} IST`,
            );
        }
        return;
    }

    if (slot < start && slot >= end) {
        throw ApiError.badRequest(
            `bookings are only accepted between ${policy.operatingHoursStart} and ${policy.operatingHoursEnd} IST`,
        );
    }
}

export function assertBookableSlot(
    scheduledAt: Date | null | undefined,
    policy: BookingPolicy = DEFAULT_BOOKING_POLICY,
): void {
    if (!scheduledAt) {
        throw ApiError.badRequest("pick a date and time on the product page");
    }

    const minLeadMs = policy.minLeadHours * 60 * 60 * 1000;
    const minStart = Date.now() + minLeadMs;
    if (scheduledAt.getTime() <= minStart) {
        throw ApiError.badRequest(
            policy.minLeadHours === 1
                ? "slot must be at least 1 hour from now"
                : `slot must be at least ${policy.minLeadHours} hours from now`,
        );
    }

    assertWithinOperatingHours(scheduledAt, policy);
}
