import {
  ClockIcon,
  CopyIcon,
  CreditCardIcon,
  MapPinIcon,
  ShoppingBagIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { buildCouponPreviewFromApplied } from "@/module/booking/lib/coupon-preview";

const CONDITION_ICONS = {
  bag: ShoppingBagIcon,
  clock: ClockIcon,
  card: CreditCardIcon,
  pin: MapPinIcon,
};

export function CouponDetailSheet({ coupon, open, onOpenChange }) {
  const preview = coupon ? buildCouponPreviewFromApplied(coupon) : null;

  async function copyCode() {
    if (!preview?.code) return;
    try {
      await navigator.clipboard.writeText(preview.code);
      toast.add({ title: "Code copied", description: preview.code, type: "success" });
    } catch {
      toast.add({ title: "Could not copy code", type: "error" });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] rounded-t-3xl px-4 pb-8">
        {preview ? (
          <>
            <SheetHeader className="border-b border-border/60 pb-4 text-left">
              <SheetTitle className="font-heading text-xl">{preview.discount}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {coupon.name || preview.label}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4 flex flex-col gap-4 overflow-y-auto">
              <div
                className="flex items-center justify-between gap-3 rounded-2xl border border-primary/40 bg-primary/15 px-4 py-3"
              >
                <span className="font-mono text-base font-bold tracking-wider text-foreground uppercase">
                  {preview.code}
                </span>
                <Button
                  type="button"
                  size="sm"
                  className="shrink-0 rounded-full bg-primary text-black hover:bg-primary/85"
                  onClick={() => void copyCode()}
                >
                  <CopyIcon className="size-3.5" />
                  Copy
                </Button>
              </div>

              {preview.description ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{preview.description}</p>
              ) : null}

              {coupon.eligibilitySummary ? (
                <p className="text-sm text-foreground">{coupon.eligibilitySummary}</p>
              ) : null}

              {preview.conditions?.length ? (
                <ul className="flex flex-col gap-2">
                  {preview.conditions.map((item) => {
                    const Icon = CONDITION_ICONS[item.icon] ?? ShoppingBagIcon;
                    return (
                      <li
                        key={`${item.icon}-${item.label}`}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Icon className="size-4 shrink-0 text-foreground/60" aria-hidden />
                        {item.label}
                      </li>
                    );
                  })}
                </ul>
              ) : null}

              <p className="text-xs text-muted-foreground">
                Apply this code at checkout after adding to your bag.
              </p>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
