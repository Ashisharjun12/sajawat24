import { useEffect, useState } from "react";
import { PlusIcon } from "lucide-react";
import { getApiError } from "@/api/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckoutAddressPickerSkeleton } from "@/module/booking/components/CheckoutAddressPickerSkeleton";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import {
  AddressFormDialog,
  emptyAddressForm,
} from "@/module/account/components/AddressFormDialog";
import { useAddressMutations, useAddressesQuery } from "@/module/account/hooks/use-addresses-query";

function checkoutAddressInitial(delivery, cartCityId, cartCityName) {
  const pin = (delivery?.pincode ?? "").replace(/\D/g, "").slice(0, 6);
  const cityId = delivery?.cityId ?? cartCityId ?? null;
  const cityName = delivery?.cityName || cartCityName || "";
  return {
    ...emptyAddressForm,
    pincode: pin,
    address: delivery?.address ?? "",
    landmark: delivery?.landmark ?? "",
    cityName,
    cityId,
    latitude: delivery?.latitude ?? null,
    longitude: delivery?.longitude ?? null,
  };
}

function applyAddressToDelivery(address, cartCityId) {
  const mismatch = cartCityId && address.cityId && address.cityId !== cartCityId;
  return {
    pincode: address.pincode,
    address: address.address,
    landmark: address.landmark ?? "",
    cityName: address.cityName,
    cityId: address.cityId,
    latitude: address.latitude ?? null,
    longitude: address.longitude ?? null,
    pinStatus: mismatch ? "error" : "ok",
    pinMessage: mismatch
      ? `This address is in ${address.cityName}. Your order is priced for a different city.`
      : address.cityName
        ? `We deliver to ${address.cityName}`
        : "We deliver here",
  };
}

export function CheckoutAddressPicker({
  value,
  onChange,
  cartCityId,
  cartCityName = "",
  useManual,
  onUseManualChange,
  onReturnToSaved,
  onExitManual,
  onGeoConfirmed,
  onRequestPinReview,
  onSelectedAddressIdChange,
  onSavedAddressApplied,
}) {
  const { data: addresses = [], isLoading } = useAddressesQuery();
  const { create } = useAddressMutations();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [addressFormInitial, setAddressFormInitial] = useState(emptyAddressForm);
  const [selectedId, setSelectedId] = useState(null);

  function openAddressDialog() {
    setAddressFormInitial(checkoutAddressInitial(value, cartCityId, cartCityName));
    setDialogOpen(true);
  }

  const hasSaved = addresses.length > 0;

  function selectAddress(address, { openMap = false } = {}) {
    setSelectedId(address.id);
    onSelectedAddressIdChange?.(address.id);
    onExitManual?.();
    onChange({ ...value, ...applyAddressToDelivery(address, cartCityId) });
    onSavedAddressApplied?.(address);
    if (openMap) {
      onGeoConfirmed?.(false);
      onRequestPinReview?.();
    }
  }

  function startManualEntry() {
    setSelectedId(null);
    onUseManualChange();
  }

  useEffect(() => {
    if (!hasSaved || useManual || selectedId) return;
    const pick = addresses.find((row) => row.isDefault) ?? addresses[0];
    if (pick) selectAddress(pick, { openMap: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasSaved, useManual, addresses, selectedId]);

  async function onCreateAddress(body) {
    try {
      const saved = await create.mutateAsync(body);
      setDialogOpen(false);
      toast.add({ title: "Address saved", type: "success" });
      onReturnToSaved?.();
      selectAddress(saved, { openMap: true });
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" });
    }
  }

  if (isLoading) {
    return <CheckoutAddressPickerSkeleton />;
  }

  return (
    <div className="flex flex-col gap-4">
      {hasSaved ? (
        <>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Saved addresses</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Tap a saved address to use it for this order.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={openAddressDialog}
            >
              <PlusIcon className="size-4" />
              Add address
            </Button>
          </div>
          <ul className="flex flex-col gap-2">
            {addresses.map((row) => {
              const selected = selectedId === row.id;
              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => selectAddress(row)}
                    className={cn(
                      "w-full rounded-lg border px-4 py-3 text-left transition-colors",
                      selected
                        ? "border-foreground/30 bg-muted/40"
                        : "border-border hover:bg-muted/20",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold">{row.label}</span>
                      {row.isDefault ? (
                        <Badge variant="secondary" className="text-[10px]">Default</Badge>
                      ) : null}
                      {row.latitude != null && row.longitude != null ? (
                        <Badge variant="outline" className="text-[10px]">Pin saved</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {row.cityName} · {row.pincode}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-foreground">{row.address}</p>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end">
            {useManual ? (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-sm text-muted-foreground"
                onClick={() => onReturnToSaved?.()}
              >
                Cancel one-time address
              </Button>
            ) : (
              <Button
                type="button"
                variant="link"
                className="h-auto px-0 text-sm text-muted-foreground"
                onClick={startManualEntry}
              >
                Deliver once without saving
              </Button>
            )}
          </div>
        </>
      ) : useManual ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">One-time delivery — not saved to your account.</p>
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 text-sm"
            onClick={() => onReturnToSaved?.()}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm text-muted-foreground">No saved addresses yet.</p>
            <Button
              type="button"
              size="sm"
              className="shrink-0 gap-1.5"
              onClick={openAddressDialog}
            >
              <PlusIcon className="size-4" />
              Add address
            </Button>
          </div>
          <div className="flex justify-end">
            <Button
              type="button"
              variant="link"
              className="h-auto px-0 text-sm text-muted-foreground"
              onClick={startManualEntry}
            >
              Deliver without saving
            </Button>
          </div>
        </div>
      )}

      <AddressFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title="Add delivery address"
        description="Enter where we should set up your decoration. You will pin the exact spot next."
        submitLabel="Save & use for order"
        initial={addressFormInitial}
        submitting={create.isPending}
        contextCityId={cartCityId ?? null}
        contextCityName={cartCityName}
        contextCityPinHint={Boolean(cartCityName)}
        onSubmit={(body) => void onCreateAddress(body)}
      />
    </div>
  );
}
