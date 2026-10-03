import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CouponOffersList } from "@/module/promotions/components/CouponOffersList";
import { useAvailableCoupons } from "@/module/promotions/lib/use-available-coupons";
import { formatLocationLabel, useLocationStore } from "@/store/location.store";

export function OffersPage() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("productId") || undefined;
  const categoryId = searchParams.get("categoryId") || undefined;
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const source = useLocationStore((s) => s.source);
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);

  const { coupons, loading } = useAvailableCoupons({
    productId,
    categoryId,
    scope: "city",
  });

  const forThisSetup = coupons.filter((c) => c.appliesToProduct);
  const otherOffers = coupons.filter((c) => !c.appliesToProduct);
  const locationLabel = formatLocationLabel(city, pincode, source);
  const splitByProduct = Boolean(productId && categoryId);

  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-foreground">Home</Link>
        {" / "}
        <span className="text-foreground">Offers</span>
      </nav>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight">Offers &amp; coupons</h1>
          <p className="mt-2 max-w-[60ch] text-sm text-muted-foreground">
            Copy a code and apply it at checkout. Prices shown for{" "}
            <span className="font-medium text-foreground">{locationLabel}</span>.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => setPickerOpen(true)}>
          Change city
        </Button>
      </div>

      {loading ? (
        <p className="mt-10 text-sm text-muted-foreground">Loading offers…</p>
      ) : coupons.length === 0 ? (
        <div className="mt-10 rounded-3xl border border-dashed border-border px-6 py-14 text-center">
          <p className="font-heading text-lg font-semibold">No offers right now</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Check back soon or try another city.
          </p>
        </div>
      ) : splitByProduct ? (
        <div className="mt-10 flex flex-col gap-10">
          {forThisSetup.length > 0 ? (
            <section aria-labelledby="offers-for-setup">
              <h2 id="offers-for-setup" className="mb-3 text-lg font-semibold tracking-tight">
                For this setup
              </h2>
              <CouponOffersList coupons={forThisSetup} className="flex flex-col gap-3" />
            </section>
          ) : null}
          {otherOffers.length > 0 ? (
            <section aria-labelledby="offers-more">
              <h2 id="offers-more" className="mb-3 text-lg font-semibold tracking-tight">
                More offers
              </h2>
              <CouponOffersList coupons={otherOffers} className="flex flex-col gap-3" />
            </section>
          ) : null}
        </div>
      ) : (
        <section className="mt-10" aria-labelledby="offers-all">
          <h2 id="offers-all" className="mb-3 text-lg font-semibold tracking-tight">
            All offers
          </h2>
          <CouponOffersList coupons={coupons} className="flex flex-col gap-3" />
        </section>
      )}
    </div>
  );
}
