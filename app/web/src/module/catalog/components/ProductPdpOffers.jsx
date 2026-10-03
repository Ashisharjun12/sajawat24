import { Link } from "react-router-dom";
import { TicketPercentIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { ProductPdpSectionTrigger } from "@/module/catalog/components/ProductPdpSectionTrigger";
import { CouponOffersList } from "@/module/promotions/components/CouponOffersList";
import { useAvailableCoupons } from "@/module/promotions/lib/use-available-coupons";

const PDP_OFFER_PREVIEW_LIMIT = 4;

function offersPageHref(productId, categoryId) {
  const params = new URLSearchParams();
  if (productId) params.set("productId", productId);
  if (categoryId) params.set("categoryId", categoryId);
  const q = params.toString();
  return q ? `/offers?${q}` : "/offers";
}

export function ProductPdpOffers({ productId, categoryId }) {
  const { coupons, loading } = useAvailableCoupons({
    productId,
    categoryId,
    scope: "product",
  });

  if (loading || coupons.length === 0) return null;

  const hasMore = coupons.length > PDP_OFFER_PREVIEW_LIMIT;
  const viewMoreHref = offersPageHref(productId, categoryId);

  return (
    <Accordion type="single" collapsible className="rounded-4xl border bg-card">
      <AccordionItem value="offers" className="border-none data-open:bg-transparent">
        <ProductPdpSectionTrigger
          icon={<TicketPercentIcon className="size-4" />}
          iconClassName="bg-primary/15 text-foreground"
          title="Available offers"
          subtitle={`${coupons.length} coupon${coupons.length === 1 ? "" : "s"} for this setup`}
        />
        <AccordionContent>
          <CouponOffersList
            coupons={coupons}
            limit={PDP_OFFER_PREVIEW_LIMIT}
            className="flex flex-col"
          />
          {hasMore ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3 w-full rounded-full"
              nativeButton={false}
              render={<Link to={viewMoreHref} />}
            >
              View more offers
            </Button>
          ) : null}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
