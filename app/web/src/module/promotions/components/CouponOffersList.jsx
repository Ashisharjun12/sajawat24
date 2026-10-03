import { CouponOfferCompactRow } from "@/module/promotions/components/CouponOfferCompactRow";

export function CouponOffersList({ coupons, limit, className, variant = "compact" }) {
  const visible = limit != null ? coupons.slice(0, limit) : coupons;

  if (variant !== "compact") {
    return null;
  }

  return (
    <div className={className}>
      {visible.map((coupon) => (
        <CouponOfferCompactRow key={coupon.code} coupon={coupon} />
      ))}
    </div>
  );
}
