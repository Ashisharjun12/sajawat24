import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ShoppingBagIcon, XIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { formatPaise } from "@/lib/money";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/drawer";
import { DecoryImageFallback } from "@/components/decory-image-fallback";
import { Spinner } from "@/components/ui/spinner";
import { proceedToCheckout } from "@/module/booking/lib/proceed-to-checkout";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

const priceClass =
  "tabular-nums text-emerald-700 dark:text-emerald-400";

function formatCartSlot(iso) {
  if (!iso) return null;
  try {
    return format(new Date(iso), "EEE d MMM, h a");
  } catch {
    return null;
  }
}

export function CartDrawer() {
  const navigate = useNavigate();
  const open = useCartStore((s) => s.open);
  const setOpen = useCartStore((s) => s.setOpen);
  const cart = useCartStore((s) => s.cart);
  const status = useCartStore((s) => s.status);
  const load = useCartStore((s) => s.load);
  const removeItem = useCartStore((s) => s.removeItem);
  const user = useAuthStore((s) => s.user);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);

  useEffect(() => {
    if (!open) return;
    void load().catch(() => {});
  }, [open, load]);

  async function onRemove(id) {
    try {
      await removeItem(id);
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  function onCheckout() {
    if (!cart.items?.length) return;
    proceedToCheckout({ user, setLoginOpen, navigate, setCartOpen: setOpen });
  }

  function onViewBag() {
    setOpen(false);
    navigate("/bag");
  }

  const hasItems = Boolean(cart.items?.length);
  const itemCount = cart.itemCount ?? 0;
  const subtotal = cart.subtotalPaise ?? 0;
  const discount = cart.discountPaise ?? 0;
  const total = cart.totalPaise ?? subtotal;
  const slotLabel = formatCartSlot(cart.scheduledAt);

  return (
    <Drawer open={open} onOpenChange={setOpen} swipeDirection="right">
      <DrawerContent
        className="flex h-dvh max-h-dvh flex-col rounded-none rounded-tl-3xl rounded-bl-3xl border-y-0 border-r-0 bg-background [--drawer-inset:0px] data-[swipe-axis=x]:[--drawer-content-width:100%] sm:data-[swipe-axis=x]:[--drawer-content-width:26rem]"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-4">
          <DrawerTitle className="font-heading text-lg font-bold tracking-tight">
            {hasItems ? `Cart (${itemCount} item${itemCount === 1 ? "" : "s"})` : "Cart"}
          </DrawerTitle>
          <DrawerClose
            render={
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 rounded-full px-3 text-xs font-medium text-muted-foreground"
              >
                Esc
                <XIcon className="size-3.5" />
              </Button>
            }
          />
        </div>

        <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
          {!user ? (
            <div
              className="mt-4 rounded-2xl bg-linear-to-r from-primary/90 via-primary/70 to-amber-200/80 px-4 py-3.5 text-primary-foreground"
            >
              <p className="text-sm font-semibold">Save your bag across devices</p>
              <p className="mt-1 text-xs text-primary-foreground/90">
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => {
                    setOpen(false);
                    setLoginOpen(true);
                  }}
                >
                  Log in
                </button>
                {" or "}
                <button
                  type="button"
                  className="font-medium underline underline-offset-2"
                  onClick={() => {
                    setOpen(false);
                    setLoginOpen(true);
                  }}
                >
                  sign up
                </button>
                {" "}to checkout faster.
              </p>
            </div>
          ) : null}

          {status === "loading" && !hasItems ? (
            <div className="flex min-h-48 items-center justify-center">
              <Spinner className="size-6" />
            </div>
          ) : null}

          {!hasItems && status !== "loading" ? (
            <div className="flex flex-col items-center px-4 py-14 text-center">
              <span
                className="flex size-16 items-center justify-center rounded-full bg-primary shadow-sm"
                aria-hidden
              >
                <ShoppingBagIcon className="size-8 text-primary-foreground" strokeWidth={1.5} />
              </span>
              <p className="mt-5 font-heading text-base font-semibold tracking-tight text-foreground">
                No products added
              </p>
              <p className="mt-2 max-w-[16rem] text-sm text-muted-foreground">
                Pick a decoration from the catalog and it will show up here.
              </p>
            </div>
          ) : null}

          {hasItems && slotLabel ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Event slot: <span className="font-medium text-foreground">{slotLabel}</span>
            </p>
          ) : null}

          <ul className="mt-4 flex flex-col gap-6 pb-6">
            {(cart.items ?? []).map((item) => (
              <li key={item.id} className="flex gap-3">
                <span className="relative size-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-muted">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <DecoryImageFallback className="size-full" />
                  )}
                </span>
                <div className="flex min-w-0 flex-1 flex-col">
                  <p className="font-heading text-sm font-semibold leading-snug text-foreground">
                    {item.name}
                  </p>
                  <div className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                    <p>Qty: {item.quantity ?? 1}</p>
                    {item.addons?.length ? (
                      <p className="line-clamp-2">
                        Add-ons: {item.addons.map((a) => a.name).join(", ")}
                      </p>
                    ) : null}
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${priceClass}`}>
                    {formatPaise(item.lineTotalPaise)}
                  </p>
                  <button
                    type="button"
                    className="mt-2 w-fit text-xs font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
                    onClick={() => onRemove(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="shrink-0 border-t border-border bg-background px-5 py-5">
          {hasItems ? (
            <>
              {discount > 0 ? (
                <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Before discount</span>
                  <span className="tabular-nums">{formatPaise(subtotal)}</span>
                </div>
              ) : null}
              {discount > 0 ? (
                <div className="mb-2 flex items-center justify-between text-sm text-foreground">
                  <span>
                    Discount
                    {cart.appliedCoupon?.code ? ` (${cart.appliedCoupon.code})` : ""}
                  </span>
                  <span className={priceClass}>−{formatPaise(discount)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-foreground">Subtotal</span>
                <span className={`text-lg font-bold ${priceClass}`}>
                  {formatPaise(total)}
                </span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Delivery PIN, taxes, and coupons are finalized at checkout.
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full rounded-xl font-semibold"
                  onClick={onViewBag}
                >
                  View cart ({itemCount})
                </Button>
                <Button
                  type="button"
                  size="lg"
                  className="w-full rounded-xl font-semibold"
                  onClick={onCheckout}
                >
                  Checkout
                </Button>
              </div>
            </>
          ) : (
            <Button
              type="button"
              size="lg"
              className="w-full rounded-xl font-semibold"
              onClick={() => {
                setOpen(false);
                navigate("/decorations");
              }}
            >
              Browse decorations
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
