import { useState } from "react";
import { ChevronRightIcon, CopyIcon, TicketPercentIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { buildCouponPreviewFromApplied } from "@/module/booking/lib/coupon-preview";
import { CouponDetailSheet } from "@/module/promotions/components/CouponDetailSheet";

export function CouponOfferCompactRow({ coupon, className }) {
  const preview = buildCouponPreviewFromApplied(coupon);
  const [sheetOpen, setSheetOpen] = useState(false);

  if (!preview?.code) return null;

  async function copyCode(event) {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(preview.code);
      toast.add({ title: "Code copied", description: preview.code, type: "success" });
    } catch {
      toast.add({ title: "Could not copy code", type: "error" });
    }
  }

  return (
    <>
      <div className={cn("border-b border-border/40 py-3 last:border-b-0 first:pt-0", className)}>
        <div className="flex items-center gap-2.5">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/25 text-foreground"
            aria-hidden
          >
            <TicketPercentIcon className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight text-foreground">{preview.discount}</p>
            <p className="truncate text-xs text-muted-foreground">
              {coupon.name || preview.label}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 gap-1 rounded-lg border-primary/45 bg-primary/10 px-2 font-mono text-[11px] font-bold tracking-wide uppercase hover:bg-primary/20"
            onClick={copyCode}
          >
            {preview.code}
            <CopyIcon className="size-3 opacity-70" aria-hidden />
          </Button>
        </div>
        <button
          type="button"
          className="mt-2 flex w-full items-center justify-between rounded-lg py-1.5 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
          onClick={() => setSheetOpen(true)}
        >
          Coupon details
          <ChevronRightIcon className="size-3.5 shrink-0" aria-hidden />
        </button>
      </div>

      <CouponDetailSheet coupon={coupon} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
