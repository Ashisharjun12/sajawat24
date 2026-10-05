import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { productPath } from "@/lib/catalog-path";
import { formatPaise } from "@/lib/money";
import { HomeProductCardRail } from "@/module/home/components/HomeProductCard";
import { useWishlistStore } from "@/store/wishlist.store";
import { useLocationStore, isBackendCityId } from "@/store/location.store";
import { useAuthStore } from "@/store/auth.store";

function unavailableLabel(reason) {
  if (reason === "inactive") return "This package is no longer available";
  if (reason === "no_price") return "Pricing unavailable in your area";
  return "Not available in your city";
}

export function WishlistContent({ showGuestHint = false, showPublicBreadcrumb = false }) {
  const rows = useWishlistStore((s) => s.rows);
  const hydrate = useWishlistStore((s) => s.hydrate);
  const refresh = useWishlistStore((s) => s.refresh);
  const removeUnavailable = useWishlistStore((s) => s.removeUnavailable);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityId = city?.id && isBackendCityId(city.id) ? city.id : null;
  const pin = pincode?.code?.replace(/\D/g, "").slice(0, 6) || null;

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!accessToken) return;
    if (!cityId && pin?.length !== 6) return;
    void refresh();
  }, [accessToken, cityId, pin, refresh]);

  const showGuestPromo = showGuestHint && !accessToken && rows.length > 0;

  return (
    <div className="flex w-full flex-col gap-6">
      {showGuestPromo ? (
        <section
          className="rounded-2xl border border-primary/15 bg-primary-tint px-5 py-6 shadow-sm md:flex md:items-center md:justify-between md:gap-10 md:px-8 md:py-7"
          aria-label="Sign in to book"
        >
          <div className="min-w-0 max-w-xl">
            <p className="font-heading text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Ready to book your saved setups?
            </p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">
              Sign in to checkout in a few taps and keep this list on your account.
            </p>
          </div>
          <Button
            type="button"
            variant="default"
            size="lg"
            className="mt-5 h-12 w-full px-6 text-base font-semibold md:mt-0 md:min-w-[220px] md:w-auto"
            onClick={() => setLoginOpen(true)}
          >
            Sign in to continue
          </Button>
        </section>
      ) : null}

      {showPublicBreadcrumb ? (
        <nav className="text-sm text-muted-foreground" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-foreground">Home</Link>
          {" / "}
          <span className="text-foreground">Wishlist</span>
        </nav>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight md:text-3xl">Wishlist</h1>
          <p className="mt-1 text-sm text-muted-foreground">Packages you saved for later.</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
          Refresh
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No saved setups yet. Tap the heart on any package to save it here.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((row) => {
            if (row.available && row.product) {
              return <HomeProductCardRail key={row.productId} product={row.product} />;
            }
            return (
              <div
                key={row.productId}
                className="flex flex-col rounded-[var(--r-card)] border border-border bg-card p-4 opacity-90"
              >
                <p className="line-clamp-2 font-heading text-sm font-bold">
                  {row.product?.name ?? "Saved package"}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {unavailableLabel(row.unavailableReason)}
                </p>
                {row.product?.pricePaise != null ? (
                  <p className="mt-2 text-sm font-semibold">{formatPaise(row.product.pricePaise)}</p>
                ) : null}
                <div className="mt-4 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void removeUnavailable(row.productId)}
                  >
                    Remove
                  </Button>
                  {row.product?.slug ? (
                    <Button type="button" variant="ghost" size="sm" asChild>
                      <Link to={productPath(row.product)}>View</Link>
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Account shell (legacy); prefer public `/wishlist`. */
export function WishlistPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <WishlistContent />
    </div>
  );
}

/** Public route — guests see local saves; signed-in users see server list. */
export function PublicWishlistPage() {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-4 py-8 md:px-8 md:py-12">
      <WishlistContent showGuestHint showPublicBreadcrumb />
    </div>
  );
}
