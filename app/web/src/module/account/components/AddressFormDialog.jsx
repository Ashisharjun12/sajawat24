import { useEffect, useRef, useState } from "react";
import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api";
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  NOT_DELIVERABLE_MESSAGE,
  pinLookupMessage,
  pinResolveErrorMessage,
} from "@/lib/pin-delivery-message";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/components/ui/toast";
import { DeliveryMapConfirmDialog } from "@/module/geo/components/DeliveryMapConfirmDialog";
import { PlacesAddressAutocomplete } from "@/module/geo/components/PlacesAddressAutocomplete";

export const emptyAddressForm = {
  label: "",
  address: "",
  landmark: "",
  pincode: "",
  cityName: "",
  cityId: null,
  isDefault: false,
  latitude: null,
  longitude: null,
};

export function AddressFormDialog({
  open,
  onOpenChange,
  title = "Add address",
  description = "Enter your delivery details. Next you will review them on the map.",
  submitLabel = "Save address",
  initial = emptyAddressForm,
  submitting = false,
  onSubmit,
  contextCityId = null,
  contextCityName = "",
  contextCityPinHint = false,
}) {
  const [form, setForm] = useState(initial);
  const [pinStatus, setPinStatus] = useState("idle");
  const [pinMessage, setPinMessage] = useState("");
  const [mapOpen, setMapOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!open) setMapOpen(false);
  }, [open]);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;
    wasOpenRef.current = open;
    if (!justOpened) return;

    const seedCityId = initial.cityId ?? contextCityId ?? null;
    const seedCityName = initial.cityName || contextCityName || "";
    setForm({
      ...initial,
      cityId: seedCityId,
      cityName: seedCityName || initial.cityName,
    });
    const pin = (initial.pincode ?? "").replace(/\D/g, "");
    setPinStatus(seedCityId && pin.length === 6 ? "ok" : "idle");
    setPinMessage(seedCityId && seedCityName ? `Delivering in ${seedCityName}` : "");
    setMapOpen(false);
    setFieldErrors({});
  }, [open, initial, contextCityId, contextCityName]);

  useEffect(() => {
    const code = (form.pincode ?? "").replace(/\D/g, "");
    if (code.length !== 6) {
      setPinStatus("idle");
      setPinMessage("");
      return undefined;
    }

    const scopedCityId = form.cityId ?? contextCityId ?? null;

    let cancelled = false;
    setPinStatus("loading");
    const timer = window.setTimeout(() => {
      const request = scopedCityId
        ? resolvePincode(code, { cityId: scopedCityId })
        : resolvePincode(code);

      void request
        .then((data) => {
          if (cancelled) return;
          if (!isPincodeDeliverable(data)) {
            setPinStatus("error");
            setPinMessage(pinLookupMessage(data));
            return;
          }
          if (
            contextCityId &&
            !isDeliveryPinInCartCity(data, contextCityId)
          ) {
            setPinStatus("error");
            setPinMessage(
              deliveryPinCartCityMessage(data, contextCityName || "your city"),
            );
            const city = data.city;
            setForm((f) => ({
              ...f,
              cityName: city?.name ?? f.cityName,
              cityId: city?.id ?? f.cityId,
            }));
            return;
          }
          const city = data.city;
          setForm((f) => ({
            ...f,
            cityId: city?.id ?? scopedCityId ?? f.cityId,
            cityName: city?.name ?? f.cityName,
          }));
          setPinStatus("ok");
          setPinMessage(pinLookupMessage(data));
        })
        .catch((err) => {
          if (cancelled) return;
          setPinStatus("error");
          setPinMessage(pinResolveErrorMessage(err));
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.pincode, form.cityId, contextCityId, contextCityName]);

  function validateDetails() {
    const errors = {};
    const address = form.address.trim();
    const pin = form.pincode.replace(/\D/g, "");

    if (address.length < 6) {
      errors.address = "Add flat, street, and area (at least 6 characters).";
    }
    if (pin.length !== 6) {
      errors.pincode = "Enter a valid 6-digit PIN code.";
    }
    if (pinStatus === "loading") {
      toast.add({ title: "Still checking PIN — wait a moment", type: "info" });
      return false;
    }
    if (pinStatus === "error" || pinStatus !== "ok" || !form.cityId) {
      errors.pincode = pinMessage || NOT_DELIVERABLE_MESSAGE;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function openReviewMap(event) {
    event?.preventDefault?.();
    if (!validateDetails()) return;
    setMapOpen(true);
  }

  function buildPayload(coords) {
    return {
      label: form.label.trim() || "Address",
      address: form.address.trim(),
      landmark: form.landmark.trim() || undefined,
      pincode: form.pincode.replace(/\D/g, "").slice(0, 6),
      cityId: form.cityId,
      cityName: form.cityName || undefined,
      setDefault: form.isDefault,
      latitude: coords.latitude,
      longitude: coords.longitude,
      geoSource: "geocode_manual",
    };
  }

  function handleMapConfirm(coords) {
    if (!form.cityId) {
      toast.add({ title: "PIN code is not serviceable", type: "error" });
      return;
    }
    onSubmit?.(buildPayload(coords));
  }

  const addressSummary = {
    label: form.label.trim() || "Address",
    meta: form.cityName ? `${form.cityName} · ${form.pincode}` : form.pincode,
    line: form.address.trim(),
    landmark: form.landmark?.trim() || "",
  };

  return (
    <>
      <Dialog open={open && !mapOpen} onOpenChange={onOpenChange}>
        <DialogContent className="flex max-h-[min(92vh,640px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
          <DialogHeader className="shrink-0 px-6 pt-6 pb-2">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <form
            className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6 pb-6"
            onSubmit={openReviewMap}>
            <Field>
              <FieldLabel htmlFor="addr-label">Label</FieldLabel>
              <Input
                id="addr-label"
                placeholder="Home, Office, Venue…"
                value={form.label}
                onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="addr-line">Search address</FieldLabel>
              <PlacesAddressAutocomplete
                key={open ? "addr-open" : "addr-closed"}
                id="addr-line"
                placeholder="Search area, street, building…"
                aria-invalid={Boolean(fieldErrors.address)}
                value={form.address}
                onChange={(address) =>
                  setForm((f) => ({
                    ...f,
                    address,
                    latitude: null,
                    longitude: null,
                  }))
                }
                onPlaceResolved={({ address, pincode, latitude, longitude }) => {
                  setForm((f) => ({
                    ...f,
                    address: address || f.address,
                    pincode: pincode || f.pincode,
                    latitude: latitude ?? f.latitude,
                    longitude: longitude ?? f.longitude,
                  }));
                }}
              />
              {fieldErrors.address ? (
                <p className="text-sm text-destructive">{fieldErrors.address}</p>
              ) : (
                <FieldDescription>Pick a suggestion or type your full address</FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="addr-pin">PIN code</FieldLabel>
              {contextCityPinHint && contextCityName ? (
                <FieldDescription>
                  Order is for <span className="font-medium text-foreground">{contextCityName}</span>
                  — PIN must be in this city.
                </FieldDescription>
              ) : null}
              <Input
                id="addr-pin"
                inputMode="numeric"
                placeholder="560001"
                maxLength={6}
                aria-invalid={Boolean(fieldErrors.pincode) || pinStatus === "error"}
                value={form.pincode}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    pincode: e.target.value.replace(/\D/g, "").slice(0, 6),
                    latitude: null,
                    longitude: null,
                  }))
                }
              />
              {pinStatus === "loading" ? (
                <Skeleton className="mt-1 h-4 w-44 rounded-md" aria-label="Checking delivery" />
              ) : null}
              {pinStatus === "ok" && !fieldErrors.pincode ? (
                <FieldDescription className="text-emerald-700 dark:text-emerald-400">
                  {pinMessage}
                </FieldDescription>
              ) : null}
              {fieldErrors.pincode ? (
                <p className="text-sm text-destructive">{fieldErrors.pincode}</p>
              ) : null}
              {pinStatus === "error" && !fieldErrors.pincode ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {pinMessage}
                </p>
              ) : null}
            </Field>
            <Field>
              <FieldLabel htmlFor="addr-landmark">Landmark (optional)</FieldLabel>
              <Input
                id="addr-landmark"
                value={form.landmark}
                onChange={(e) => setForm((f) => ({ ...f, landmark: e.target.value }))}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.isDefault}
                onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                className="size-4 rounded border-border"
              />
              Set as default address
            </label>
            <Button type="submit" className="w-full" disabled={pinStatus === "loading" || submitting}>
              Review address on map
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <DeliveryMapConfirmDialog
        open={mapOpen}
        onOpenChange={(next) => {
          setMapOpen(next);
          if (!next && !submitting) {
            // keep address dialog open when backing out of map
          }
        }}
        initialLatitude={form.latitude}
        initialLongitude={form.longitude}
        addressSummary={addressSummary}
        confirmLabel={submitLabel}
        saving={submitting}
        closeOnConfirm={false}
        onConfirm={handleMapConfirm}
      />
    </>
  );
}
