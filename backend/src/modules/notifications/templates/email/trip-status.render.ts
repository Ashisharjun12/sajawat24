import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { _config } from "@/config/config.js";
import type { NotificationEvent } from "@/modules/notifications/policy/events.js";
import { formatBookingSchedule } from "@/modules/notifications/templates/email/booking-confirmed.render.js";
import { EMAIL_THEME } from "@/modules/notifications/templates/email/email-theme.js";

export type TripEmailVariant = "en_route" | "on_site" | "delivery_code" | "completed";

const TEMPLATE_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "trip-status.ejs",
);

const VARIANT_META: Record<
    TripEmailVariant,
    { headline: string; badge: string; activeStep: number }
> = {
    en_route: { headline: "On the way", badge: "En route", activeStep: 2 },
    on_site: { headline: "Decorator arrived", badge: "On site", activeStep: 3 },
    delivery_code: { headline: "Completion code", badge: "Setup", activeStep: 3 },
    completed: { headline: "Booking complete", badge: "Delivered", activeStep: 4 },
};

export function tripEventToVariant(event: NotificationEvent): TripEmailVariant | null {
    switch (event) {
        case "VENDOR_EN_ROUTE":
            return "en_route";
        case "VENDOR_ON_SITE":
            return "on_site";
        case "DELIVERY_CODE":
            return "delivery_code";
        case "BOOKING_COMPLETED":
            return "completed";
        default:
            return null;
    }
}

export async function renderTripStatusEmailHtml(input: {
    variant: TripEmailVariant;
    intro: string;
    customerName: string;
    orderRef: string;
    scheduledAt: string;
    vendorName: string;
    vendorPhone?: string;
    address?: string;
    cityName?: string;
    code?: string;
    trackUrl: string;
    orderId: string;
}): Promise<string> {
    const origin = (_config.WEB_APP_ORIGIN || "http://localhost:5174").replace(/\/$/, "");
    const meta = VARIANT_META[input.variant];
    const viewUrl = input.trackUrl || `${origin}/account/bookings/${input.orderId}`;
    const scheduledLabel = input.scheduledAt.includes("T")
        ? formatBookingSchedule(input.scheduledAt)
        : input.scheduledAt;

    return ejs.renderFile(TEMPLATE_PATH, {
        theme: EMAIL_THEME,
        ...meta,
        intro: input.intro,
        customerName: input.customerName,
        orderRef: input.orderRef,
        scheduledAt: scheduledLabel,
        vendorName: input.vendorName,
        vendorPhone: input.vendorPhone || null,
        address: input.address || null,
        cityName: input.cityName || null,
        code: input.code || null,
        viewUrl,
        showCode: input.variant === "delivery_code" && Boolean(input.code),
        showVendor: input.variant !== "completed",
    });
}
