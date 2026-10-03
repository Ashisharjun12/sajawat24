export type CouponStatus = "active" | "scheduled" | "expired" | "disabled";

export function deriveCouponStatus(coupon: {
    isActive: boolean;
    startsAt: Date;
    endsAt: Date;
}): CouponStatus {
    if (!coupon.isActive) return "disabled";
    const now = new Date();
    if (coupon.endsAt < now) return "expired";
    if (coupon.startsAt > now) return "scheduled";
    return "active";
}
