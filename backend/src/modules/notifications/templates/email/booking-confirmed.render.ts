import ejs from "ejs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { _config } from "@/config/config.js";
import { EMAIL_THEME } from "@/modules/notifications/templates/email/email-theme.js";

export type BookingEmailAddon = {
    name: string;
    imageUrl: string | null;
    quantity: number;
    pricePaise: number;
};

export type BookingEmailItem = {
    name: string;
    imageUrl: string | null;
    quantity: number;
    lineTotalPaise: number;
    addons: BookingEmailAddon[];
};

const TEMPLATE_PATH = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "booking-confirmed.ejs",
);

export function formatBookingSchedule(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Kolkata",
    }).format(date);
}

export function formatInrPaise(paise: number): string {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Math.round(paise / 100));
}

export function parseBookingEmailItems(raw: string | undefined): BookingEmailItem[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw) as unknown;
        if (!Array.isArray(parsed)) return [];
        return parsed
            .map((row) => {
                if (!row || typeof row !== "object") return null;
                const item = row as Record<string, unknown>;
                const name = typeof item.name === "string" ? item.name : "Decoration";
                const imageUrl =
                    typeof item.imageUrl === "string" && /^https?:\/\//i.test(item.imageUrl)
                        ? item.imageUrl
                        : null;
                const quantity = Number(item.quantity);
                const lineTotalPaise = Number(item.lineTotalPaise);
                const rawAddons = Array.isArray(item.addons) ? item.addons : [];
                const addons: BookingEmailAddon[] = rawAddons
                    .map((addonRow) => {
                        if (!addonRow || typeof addonRow !== "object") return null;
                        const addon = addonRow as Record<string, unknown>;
                        const addonName =
                            typeof addon.name === "string" ? addon.name : "Add-on";
                        const addonImageUrl =
                            typeof addon.imageUrl === "string" &&
                            /^https?:\/\//i.test(addon.imageUrl)
                                ? addon.imageUrl
                                : null;
                        const addonQty = Number(addon.quantity);
                        const pricePaise = Number(addon.pricePaise);
                        return {
                            name: addonName,
                            imageUrl: addonImageUrl,
                            quantity:
                                Number.isFinite(addonQty) && addonQty > 0 ? addonQty : 1,
                            pricePaise: Number.isFinite(pricePaise) ? pricePaise : 0,
                        };
                    })
                    .filter((row): row is BookingEmailAddon => row !== null);
                return {
                    name,
                    imageUrl,
                    quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
                    lineTotalPaise: Number.isFinite(lineTotalPaise) ? lineTotalPaise : 0,
                    addons,
                };
            })
            .filter((row): row is BookingEmailItem => row !== null);
    } catch {
        return [];
    }
}

export async function renderBookingConfirmedHtml(input: {
    intro: string;
    customerName: string;
    customerPhone?: string;
    orderRef: string;
    scheduledAt: string;
    city: string;
    address: string;
    totalPaise: number;
    orderId: string;
    items: BookingEmailItem[];
}): Promise<string> {
    const origin = (_config.WEB_APP_ORIGIN || "http://localhost:5174").replace(/\/$/, "");
    return ejs.renderFile(TEMPLATE_PATH, {
        theme: EMAIL_THEME,
        intro: input.intro,
        customerName: input.customerName,
        customerPhone: input.customerPhone?.trim() || "",
        orderRef: input.orderRef,
        scheduledAt: input.scheduledAt,
        city: input.city,
        address: input.address,
        total: formatInrPaise(input.totalPaise),
        items: input.items.map((item) => ({
            ...item,
            lineTotal: formatInrPaise(item.lineTotalPaise),
            initial: item.name.slice(0, 1).toUpperCase() || "D",
            addons: (item.addons ?? []).map((addon) => ({
                ...addon,
                lineTotal: formatInrPaise(addon.pricePaise),
                initial: addon.name.slice(0, 1).toUpperCase() || "+",
            })),
        })),
        viewUrl: `${origin}/account/bookings/${input.orderId}`,
    });
}
