import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckIcon, ChevronLeftIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { getPaymentMethods } from "@/api/payments.api";
import { OnlinePaymentIncompleteError } from "@/module/booking/lib/payment-flow-errors";
import { placeCheckoutOrder } from "@/module/booking/lib/place-order";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperContent,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTitle,
  StepperTrigger,
} from "@/components/reui/stepper";
import { CheckoutPageSkeleton } from "@/module/booking/components/CheckoutPageSkeleton";
import { cn } from "@/lib/utils";
import { isValidIndianMobile } from "@/module/auth/phone-login";
import { CheckoutCustomerStep } from "@/module/booking/components/CheckoutCustomerStep";
import { CheckoutDeliveryStep } from "@/module/booking/components/CheckoutDeliveryStep";
import { CheckoutPaymentStep } from "@/module/booking/components/CheckoutPaymentStep";
import { CheckoutReviewStep } from "@/module/booking/components/CheckoutReviewStep";
import { CheckoutSummary } from "@/module/booking/components/CheckoutSummary";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";

const STEPS = [
  { step: 1, title: "Customer", description: "You" },
  { step: 2, title: "Delivery", description: "Address" },
  { step: 3, title: "Payment", description: "How to pay" },
  { step: 4, title: "Review", description: "Confirm" },
];

const STEP_SECTIONS = {
  1: {
    title: "Customer details",
    description: "We'll use this to confirm your booking.",
  },
  2: {
    title: "Delivery",
    description: "We check the PIN against cities we serve.",
  },
  3: {
    title: "Payment",
    description: "Choose how you'll pay. Nothing is charged yet.",
  },
  4: {
    title: "Review",
    description: "Check everything before you place the booking.",
  },
};

function CheckoutTopBar() {
  return (
    <div className="border-b border-border/60 bg-background">
      <div className="mx-auto max-w-[1400px] px-6 py-4 lg:px-10">
        <Link
          to="/decorations"
          className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Continue shopping
        </Link>
      </div>
    </div>
  );
}

function StepSection({ step, children }) {
  const section = STEP_SECTIONS[step];
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-semibold tracking-tight">{section.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
      </div>
      <div
        className={cn(
          "checkout-form space-y-4",
          "[&_input]:rounded-lg [&_input]:placeholder:text-muted-foreground [&_textarea]:rounded-lg [&_textarea]:placeholder:text-muted-foreground",
          "[&_[data-slot=input-group]]:rounded-lg [&_[data-slot=input-group]]:overflow-hidden",
        )}
      >
        {children}
      </div>
    </div>
  );
}

function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

export function CheckoutPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const cart = useCartStore((s) => s.cart);
  const cartStatus = useCartStore((s) => s.status);
  const load = useCartStore((s) => s.load);

  const [step, setStep] = useState(1);
  const [maxStep, setMaxStep] = useState(1);
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [delivery, setDelivery] = useState({
    pincode: "",
    address: "",
    landmark: "",
    cityName: "",
    cityId: null,
    pinStatus: "idle",
    pinMessage: "",
    latitude: null,
    longitude: null,
  });
  const [deliveryGeoConfirmed, setDeliveryGeoConfirmed] = useState(false);
  const [payment, setPayment] = useState("");
  const [platformPay, setPlatformPay] = useState({ cod: true, online: false, provider: null });
  const [placing, setPlacing] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [paymentIncomplete, setPaymentIncomplete] = useState(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());

  useEffect(() => {
    void load().catch(() => {});
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    getPaymentMethods()
      .then((data) => {
        if (!cancelled) {
          setPlatformPay({
            cod: data?.cod !== false,
            online: Boolean(data?.online),
            provider: data?.provider ?? null,
          });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!user) return;
    setCustomer((prev) => ({
      name: prev.name || user.name || "",
      phone: prev.phone || user.phone || "",
      email: prev.email || user.email || "",
    }));
  }, [user]);

  useEffect(() => {
    if (cart?.pincode && !delivery.pincode) {
      setDelivery((prev) => ({ ...prev, pincode: String(cart.pincode).replace(/\D/g, "").slice(0, 6) }));
    }
    // only seed once from cart
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.pincode]);

  const seededCartGeoRef = useRef(false);
  useEffect(() => {
    if (seededCartGeoRef.current) return;
    if (cart?.deliveryLatitude == null || cart?.deliveryLongitude == null) return;
    seededCartGeoRef.current = true;
    setDeliveryGeoConfirmed(true);
    setDelivery((prev) => ({
      ...prev,
      latitude: cart.deliveryLatitude,
      longitude: cart.deliveryLongitude,
    }));
  }, [cart?.deliveryLatitude, cart?.deliveryLongitude]);

  const hasItems = Boolean(cart.items?.length);
  const cartReady = cartStatus === "ready" || cartStatus === "error";
  const items = cart.items ?? [];
  const allowCod =
    Boolean(platformPay.cod) && items.length > 0 && items.every((item) => item.paymentCod !== false);
  const allowOnline =
    Boolean(platformPay.online) && items.length > 0 && items.every((item) => item.paymentOnline);

  useEffect(() => {
    if (payment === "cod" && !allowCod) setPayment("");
    if (payment === "online" && !allowOnline) setPayment("");
    if (!payment && allowCod && !allowOnline) setPayment("cod");
    if (!payment && allowOnline && !allowCod) setPayment("online");
  }, [allowCod, allowOnline, payment]);

  useEffect(() => {
    if (!cartReady || cartStatus === "loading") return;
    if (!hasItems) {
      navigate("/decorations", { replace: true });
    }
  }, [cartReady, cartStatus, hasItems, navigate]);

  const isInstantCart = cart?.fulfillmentType === "instant";
  const hasCartDeliveryGeo =
    cart?.deliveryLatitude != null && cart?.deliveryLongitude != null && deliveryGeoConfirmed;

  const customerOk =
    customer.name.trim().length > 1 && isValidIndianMobile(customer.phone) && isEmail(customer.email);
  const deliveryFieldsOk = delivery.pinStatus === "ok" && delivery.address.trim().length > 5;
  const deliveryGeoOk = !isInstantCart || hasCartDeliveryGeo;
  const deliveryOk = deliveryFieldsOk && deliveryGeoOk;
  const paymentOk = payment === "online" || payment === "cod";

  const canNext = step === 1 ? customerOk : step === 2 ? deliveryOk : step === 3 ? paymentOk : false;
  const setCartLocation = useCartStore((s) => s.setLocation);

  function handleDeliveryChange(next) {
    setDelivery(next);
    setDeliveryGeoConfirmed(false);
  }

  function goTo(next) {
    if (next < 1 || next > 4) return;
    if (next > maxStep) return;
    setStep(next);
  }

  function deliveryStepHint() {
    if (deliveryFieldsOk && !deliveryGeoOk && isInstantCart) {
      return "Confirm your delivery location on the map for instant delivery.";
    }
    if (!deliveryFieldsOk) {
      if (delivery.pinStatus === "error" && delivery.pinMessage) {
        return delivery.pinMessage;
      }
      return "Enter a serviceable delivery PIN and full address.";
    }
    return "Complete delivery details to continue.";
  }

  async function syncCartDeliveryPin() {
    if (!cart?.cityId || !delivery.pincode) return;
    const pin = delivery.pincode.replace(/\D/g, "").slice(0, 6);
    if (pin.length !== 6 || delivery.pinStatus !== "ok") return;
    try {
      await setCartLocation({ cityId: cart.cityId, pincode: pin });
    } catch {
      // checkout can still proceed; order uses delivery payload
    }
  }

  function onNext() {
    if (!canNext) {
      if (step === 2) {
        toast.add({ title: deliveryStepHint(), type: "error" });
      }
      return;
    }
    const next = Math.min(4, step + 1);
    if (step === 2) {
      void syncCartDeliveryPin();
    }
    setMaxStep((prev) => Math.max(prev, next));
    setStep(next);
  }

  async function onPlace() {
    if (placing) return;
    if (!delivery.cityId) {
      toast.add({ title: "Enter a serviceable delivery PIN", type: "error" });
      return;
    }
    if (isInstantCart && !hasCartDeliveryGeo) {
      toast.add({ title: "Confirm your delivery location on the map", type: "error" });
      return;
    }

    setPlacing(true);
    try {
      const payload = {
        customer: {
          name: customer.name.trim(),
          phone: customer.phone.replace(/\D/g, "").slice(-10),
          email: customer.email.trim(),
        },
        delivery: {
          pincode: delivery.pincode.replace(/\D/g, "").slice(0, 6),
          address: delivery.address.trim(),
          landmark: delivery.landmark.trim() || undefined,
          cityId: delivery.cityId,
          ...(cart.deliveryLatitude != null && cart.deliveryLongitude != null
            ? {
                latitude: cart.deliveryLatitude,
                longitude: cart.deliveryLongitude,
              }
            : {}),
        },
        paymentMethod: payment,
        idempotencyKey: idempotencyKeyRef.current,
      };

      const { orderId, status } = await placeCheckoutOrder({
        payload,
        payment,
        customer: payload.customer,
      });

      if (status !== "CONFIRMED") {
        throw new Error("Booking was not confirmed.");
      }

      setPendingOrderId(null);
      setPaymentIncomplete(false);
      await load().catch(() => {});
      navigate(`/checkout/success/${orderId}`, { replace: true });
    } catch (err) {
      if (err instanceof OnlinePaymentIncompleteError) {
        setPendingOrderId(err.orderId);
        setPaymentIncomplete(true);
        setStep(3);
        toast.add({
          title: "Payment didn't go through",
          description: err.userCancelled
            ? "You left checkout before paying. Nothing was charged. Your bag is saved — try again or choose Cash on delivery."
            : "We couldn't complete the payment. Nothing was charged. Your bag is saved — try again or choose Cash on delivery.",
          type: "error",
        });
        return;
      }
      toast.add({ title: getApiError(err), type: "error" });
    } finally {
      setPlacing(false);
    }
  }

  if (!cartReady || (cartStatus === "loading" && !hasItems)) {
    return <CheckoutPageSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <CheckoutTopBar />

      <div className="mx-auto grid w-full max-w-[1400px] lg:grid-cols-[minmax(0,1fr)_min(420px,38%)]">
        <div className="order-1 min-w-0 bg-background px-6 py-8 lg:px-10 lg:py-10">
          <Stepper
            value={step}
            onValueChange={goTo}
            className="space-y-8"
            indicators={{
              completed: <CheckIcon className="size-3" />,
            }}
          >
            <div className="space-y-2">
              <StepperNav className="gap-1 [&_[data-slot=stepper-separator]]:bg-border/50">
                {STEPS.map((item, index) => (
                  <StepperItem
                    key={item.step}
                    step={item.step}
                    completed={step > item.step}
                    disabled={item.step > maxStep}
                    className="min-w-0 flex-1"
                  >
                    <StepperTrigger className="gap-2 py-1">
                      <StepperIndicator className="size-7 text-xs">{item.step}</StepperIndicator>
                      <span className="flex min-w-0 flex-col text-left">
                        <StepperTitle className="text-xs font-medium sm:text-sm">{item.title}</StepperTitle>
                        <StepperDescription className="hidden text-xs sm:block">
                          {item.description}
                        </StepperDescription>
                      </span>
                    </StepperTrigger>
                    {index < STEPS.length - 1 ? <StepperSeparator className="mx-1" /> : null}
                  </StepperItem>
                ))}
              </StepperNav>
              <p className="text-xs text-muted-foreground lg:hidden">Step {step} of 4</p>
            </div>

            <StepperPanel>
              <StepperContent value={1}>
                <StepSection step={1}>
                  <CheckoutCustomerStep value={customer} onChange={setCustomer} />
                </StepSection>
              </StepperContent>
              <StepperContent value={2}>
                <StepSection step={2}>
                  <CheckoutDeliveryStep
                    value={delivery}
                    onChange={handleDeliveryChange}
                    cartCityId={cart.cityId}
                    geoConfirmed={deliveryGeoConfirmed}
                    onGeoConfirmed={setDeliveryGeoConfirmed}
                  />
                </StepSection>
              </StepperContent>
              <StepperContent value={3}>
                <StepSection step={3}>
                  <CheckoutPaymentStep
                    value={payment}
                    onChange={setPayment}
                    allowCod={allowCod}
                    allowOnline={allowOnline}
                    paymentIncomplete={paymentIncomplete && Boolean(pendingOrderId)}
                  />
                </StepSection>
              </StepperContent>
              <StepperContent value={4}>
                <StepSection step={4}>
                  <CheckoutReviewStep
                    customer={customer}
                    delivery={delivery}
                    payment={payment}
                    scheduledAt={cart.scheduledAt}
                    subtotalPaise={cart.subtotalPaise}
                    discountPaise={cart.discountPaise}
                    totalPaise={cart.totalPaise}
                    appliedCoupon={cart.appliedCoupon}
                    onPlace={onPlace}
                    placing={placing}
                  />
                </StepSection>
              </StepperContent>
            </StepperPanel>
          </Stepper>

          {step < 4 ? (
            <div className="mt-8 flex w-full gap-2 sm:w-auto">
              {step > 1 ? (
                <Button
                  type="button"
                  variant="outline"
                  className="shrink-0"
                  onClick={() => goTo(step - 1)}
                >
                  Back
                </Button>
              ) : null}
              <Button
                type="button"
                className="flex-1 sm:flex-none sm:min-w-40"
                disabled={!canNext}
                onClick={onNext}
              >
                Continue
              </Button>
            </div>
          ) : (
            <div className="mt-8">
              <Button type="button" variant="outline" onClick={() => goTo(3)}>
                Back
              </Button>
            </div>
          )}
        </div>

        <aside
          className="order-2 border-t border-border/60 bg-muted/30 px-6 py-8 lg:order-2 lg:min-h-[calc(100dvh-8rem)] lg:border-t-0 lg:border-l lg:px-8 lg:py-10 lg:sticky lg:top-20 lg:self-start"
        >
          <CheckoutSummary cart={cart} paymentMethod={payment} />
        </aside>
      </div>
    </div>
  );
}
