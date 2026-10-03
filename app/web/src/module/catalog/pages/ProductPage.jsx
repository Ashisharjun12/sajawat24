import { Link, useLocation, useParams } from "react-router-dom";
import { getApiError } from "@/api/api";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { truncateDescription } from "@/lib/site-seo";
import { useSiteShell } from "@/module/site/hooks/use-site-shell";
import { ProductPdp, ProductPdpSkeleton } from "@/module/catalog/components/ProductPdp";
import {
  useProductDetailLocation,
  useProductDetailQuery,
} from "@/module/catalog/hooks/use-product-detail-query";
import { useLocationStore } from "@/store/location.store";

export function ProductPage() {
  const { id } = useParams();
  const { pathname } = useLocation();
  const { brand } = useSiteShell();
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);
  const { hasLocation } = useProductDetailLocation();

  const { data: product, isLoading, isError, error } = useProductDetailQuery(id, {
    enabled: hasLocation,
  });

  if (!id) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1240px] overflow-x-hidden px-4 py-6 md:px-8 md:py-10">
        <div className="flex flex-col items-start gap-4 rounded-4xl border bg-card p-6">
          <h1 className="font-heading text-2xl font-medium tracking-tight">Product not found</h1>
        </div>
      </div>
    );
  }

  const seoTitle = product?.name ?? "Decoration setup";
  const seoDescription = product?.description
    ? truncateDescription(product.description)
    : undefined;
  const firstImage = product?.images?.[0];
  const ogImage =
    firstImage?.url ||
    firstImage?.publicUrl ||
    firstImage?.optimizedUrl ||
    firstImage?.thumbnailUrl ||
    brand.logoLightUrl ||
    brand.logoDarkUrl;

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1240px] overflow-x-hidden px-0 pb-6 pt-0 md:px-8 md:py-10">
      <SeoHead
        title={seoTitle}
        description={seoDescription}
        pathname={pathname}
        siteName={brand.companyName || undefined}
        ogImage={ogImage || undefined}
      />
      {!hasLocation ? (
        <div className="mx-4 mt-6 flex flex-col items-start gap-4 rounded-4xl border bg-card p-6 md:mx-0 md:mt-0">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Choose your city
          </h1>
          <p className="max-w-[50ch] text-sm text-muted-foreground">
            Product pricing and availability depend on your location. Select a city to continue.
          </p>
          <Button type="button" onClick={() => setPickerOpen(true)}>
            Select city
          </Button>
        </div>
      ) : null}

      {hasLocation && isLoading ? <ProductPdpSkeleton /> : null}

      {hasLocation && isError ? (
        <div className="mx-4 mt-6 flex flex-col items-start gap-4 rounded-4xl border bg-card p-6 md:mx-0 md:mt-0">
          <h1 className="font-heading text-2xl font-medium tracking-tight">
            Couldn’t load this setup
          </h1>
          <p className="max-w-[50ch] text-sm text-muted-foreground">{getApiError(error)}</p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => setPickerOpen(true)}>
              Change city
            </Button>
            <Button type="button" nativeButton={false} render={<Link to="/decorations" />}>
              Browse decorations
            </Button>
          </div>
        </div>
      ) : null}

      {hasLocation && product ? (
        <ProductPdp product={product} onChangeLocation={() => setPickerOpen(true)} />
      ) : null}
    </div>
  );
}
