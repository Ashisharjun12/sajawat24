import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeftIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { isValidIndianMobileDigits, toLocalPhone } from "@/lib/indian-phone";
import { NOT_DELIVERABLE_MESSAGE } from "@/lib/pin-delivery-message";
import { useLockPageScrollWhen } from "@/lib/use-lock-page-scroll";
import { useMediaMdDown } from "@/module/catalog/hooks/use-media-md-down";
import { useAddressesQuery } from "@/module/account/hooks/use-addresses-query";
import { useDeliveryPinCheck } from "@/module/account/hooks/use-delivery-pin-check";
import { AddressDetailsStep } from "@/module/account/components/address-flow/AddressDetailsStep";
import {
  choiceFromLabel,
  resolveAddressLabel,
} from "@/module/account/components/address-flow/AddressLabelChips";
import { AddressMapStep } from "@/module/account/components/address-flow/AddressMapStep";
import {
  buildAddressPayload,
  composeAddressLine,
  emptyAddressForm,
} from "@/module/account/lib/address-form";
import { useAuthStore } from "@/store/auth.store";

// Callers import the empty form from here.
export { emptyAddressForm };

/**
 * Add / edit address. Two steps in one container (bottom sheet on phones, dialog on desktop):
 *   1. map: pick the exact spot (opens on the device location, blocks undeliverable spots)
 *   2. details: house / building / landmark, Home-Office-Other label, receiver, default switch
 * A new address starts on the map; editing (an address that already has a spot) starts on the
 * details. `onSubmit(payload)` receives the request body; the caller saves it and closes the flow.
 * `title` / `description` / `contextCityPinHint` from older callers are no longer used.
 */
export function AddressFormDialog({
  open,
  onOpenChange,
  submitLabel = "Save Address",
  initial = emptyAddressForm,
  submitting = false,
  onSubmit,
  contextCityId = null,
  contextCityName = "",
  isEdit = false,
}) {
  const isMobile = useMediaMdDown();
  const user = useAuthStore((s) => s.user);
  const { data: savedAddresses = [] } = useAddressesQuery();

  const [step, setStep] = useState("map");
  /** Bumped each time the map step is shown so it starts fresh (own camera + location lookup). */
  const [mapSession, setMapSession] = useState(0);
  const [mapFromDetails, setMapFromDetails] = useState(false);
  const [form, setForm] = useState(emptyAddressForm);
  const [labelChoice, setLabelChoice] = useState("home");
  const [customLabel, setCustomLabel] = useState("");
  const [focusCustomLabel, setFocusCustomLabel] = useState(false);
  /** PIN typed by the user, only when the map data had none. */
  const [pinTyped, setPinTyped] = useState("");
  const [touched, setTouched] = useState({});
  const [attempted, setAttempted] = useState(false);
  /** False until the fields are seeded, so the wrong step never mounts (and never asks for location). */
  const [seeded, setSeeded] = useState(false);
  const wasOpenRef = useRef(false);
  const submitLockRef = useRef(false);

  useLockPageScrollWhen(open);

  // Seed every field when the flow opens (not on later re-renders).
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      setSeeded(false);
      return;
    }
    if (wasOpenRef.current) return;
    wasOpenRef.current = true;

    const seed = {
      ...emptyAddressForm,
      ...initial,
      cityId: initial.cityId ?? contextCityId ?? null,
      cityName: initial.cityName || contextCityName || "",
    };
    // Receiver defaults to the account holder; they can change it.
    seed.receiverName = seed.receiverName || user?.name?.trim() || "";
    seed.receiverPhone = seed.receiverPhone || toLocalPhone(user?.phone ?? "");
    const label = choiceFromLabel(seed.label);

    setForm(seed);
    setLabelChoice(label.choice);
    setCustomLabel(label.custom);
    setFocusCustomLabel(false);
    setPinTyped("");
    setTouched({});
    setAttempted(false);
    submitLockRef.current = false;
    setMapFromDetails(false);
    setMapSession((n) => n + 1);
    setStep(seed.latitude != null && seed.longitude != null ? "details" : "map");
    setSeeded(true);
  }, [open, initial, contextCityId, contextCityName, user]);

  useEffect(() => {
    if (!submitting) submitLockRef.current = false;
  }, [submitting]);

  const hasCoords = form.latitude != null && form.longitude != null;
  /** The map step already read (and validated) a PIN. Otherwise the user types it. */
  const pinFromMap = Boolean(form.pincode);
  const pincode = (form.pincode || pinTyped).replace(/\D/g, "").slice(0, 6);

  const pinCheck = useDeliveryPinCheck({
    pincode,
    formCityId: form.cityId,
    contextCityId,
    contextCityName,
    enabled: open && step === "details" && !pinFromMap,
  });

  const cityId = pinCheck.city?.id ?? form.cityId ?? contextCityId ?? null;
  const cityName = pinCheck.city?.name || form.cityName || contextCityName || "";

  /** The last saved address with a pin, used only when the device location is unavailable. */
  const savedSpot = useMemo(() => {
    const withPin = savedAddresses.filter((a) => a.latitude != null && a.longitude != null);
    const pick = withPin.find((a) => a.isDefault) ?? withPin[0];
    return pick ? { lat: pick.latitude, lng: pick.longitude } : null;
  }, [savedAddresses]);

  // ── Validation ──
  const houseOptional = isEdit && form.isLegacy;
  const composed = composeAddressLine(form);
  const errors = {};
  if (!form.houseFloor.trim() && !houseOptional) {
    errors.houseFloor = "Enter your house / flat number and floor.";
  } else if (composed.length < 6) {
    errors.houseFloor = "Add a few more details so the delivery partner can find you.";
  } else if (composed.length > 500) {
    errors.houseFloor = "This address is too long. Shorten it a little.";
  }
  if (labelChoice === "other" && !customLabel.trim()) {
    errors.customLabel = 'Give this address a name, like "Mom\'s place".';
  }
  if (form.receiverName.trim().length < 2) errors.receiverName = "Enter the receiver's name.";
  if (!isValidIndianMobileDigits(form.receiverPhone)) {
    errors.receiverPhone = "Enter a valid 10-digit mobile number.";
  }
  if (!pinFromMap) {
    if (pincode.length !== 6) errors.pincode = "Enter a valid 6-digit PIN code.";
    else if (pinCheck.status === "loading") errors.pincode = "Still checking the PIN. One moment.";
    else if (pinCheck.status !== "ok" || !cityId) {
      errors.pincode = pinCheck.message || NOT_DELIVERABLE_MESSAGE;
    }
  } else if (!cityId) {
    errors.pincode = NOT_DELIVERABLE_MESSAGE;
  }
  const hasErrors = Object.keys(errors).length > 0;
  const show = (key) => (attempted || touched[key] ? errors[key] : undefined);
  const touch = useCallback((key) => setTouched((t) => ({ ...t, [key]: true })), []);

  const patch = useCallback((next) => setForm((f) => ({ ...f, ...next })), []);

  function goToMap(fromDetails) {
    setMapFromDetails(fromDetails);
    setMapSession((n) => n + 1);
    setStep("map");
  }

  function handleMapConfirm(spot) {
    setForm((f) => ({
      ...f,
      latitude: spot.latitude,
      longitude: spot.longitude,
      address: spot.address,
      areaTitle: spot.areaTitle,
      pincode: spot.pincode,
      cityId: spot.city?.id ?? f.cityId ?? contextCityId ?? null,
      cityName: spot.city?.name ?? f.cityName ?? contextCityName ?? "",
      // The street line now comes from the map, so house / floor is needed again.
      isLegacy: false,
    }));
    setMapFromDetails(false);
    setStep("details");
  }

  function handleSubmit() {
    setAttempted(true);
    if (submitting || submitLockRef.current) return;
    if (!hasCoords) {
      toast.add({ title: "Choose the delivery spot on the map first", type: "error" });
      return;
    }
    if (hasErrors) return;

    const payload = buildAddressPayload(
      {
        ...form,
        label: resolveAddressLabel(labelChoice, customLabel),
        pincode,
        cityId,
        cityName,
      },
      { forUpdate: isEdit },
    );
    if (!payload) {
      toast.add({ title: "Please check the address details and try again", type: "error" });
      return;
    }
    // Guards a fast double click before the caller's pending state kicks in.
    submitLockRef.current = true;
    window.setTimeout(() => {
      submitLockRef.current = false;
    }, 1500);
    onSubmit?.(payload);
  }

  function handleOpenChange(next) {
    if (!next && submitting) return; // never close mid-save
    onOpenChange?.(next);
  }

  function handleBack() {
    if (step === "details") {
      // Editing: back leaves. Adding: back returns to the map at the chosen spot.
      if (isEdit) handleOpenChange(false);
      else goToMap(true);
      return;
    }
    if (mapFromDetails) {
      setMapFromDetails(false);
      setStep("details");
      return;
    }
    handleOpenChange(false);
  }

  const title =
    step === "map" ? "Select Your Location" : isEdit ? "Edit Address Details" : "Add Address Details";
  const Title = isMobile ? SheetTitle : DialogTitle;

  const body = (
    <>
      <div className="flex shrink-0 items-center gap-1 border-b border-border px-2 py-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleBack}
          disabled={submitting}
          aria-label="Back"
        >
          <ArrowLeftIcon className="size-5" />
        </Button>
        <Title className="min-w-0 flex-1 truncate text-center text-base font-semibold text-foreground">
          {title}
        </Title>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => handleOpenChange(false)}
          disabled={submitting}
          aria-label="Close"
        >
          <XIcon className="size-5" />
        </Button>
      </div>

      {!seeded ? null : step === "map" ? (
        <AddressMapStep
          key={mapSession}
          initialSpot={
            mapFromDetails && hasCoords ? { lat: form.latitude, lng: form.longitude } : null
          }
          savedSpot={savedSpot}
          contextCityId={contextCityId}
          contextCityName={contextCityName}
          onConfirm={handleMapConfirm}
        />
      ) : (
        <AddressDetailsStep
          form={form}
          onChange={patch}
          labelChoice={labelChoice}
          onLabelChoice={(next) => {
            if (next === "other" && labelChoice !== "other") setFocusCustomLabel(true);
            setLabelChoice(next);
          }}
          customLabel={customLabel}
          onCustomLabel={setCustomLabel}
          focusCustomLabel={focusCustomLabel}
          pinTyped={pinTyped}
          onPinTyped={setPinTyped}
          pinFromMap={pinFromMap}
          pinCheck={pinCheck}
          pincode={pincode}
          cityName={cityName}
          show={show}
          touch={touch}
          hasLocation={hasCoords}
          submitLabel={submitLabel}
          submitting={submitting}
          onChangeLocation={() => goToMap(true)}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );

  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={handleOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="gap-0 overflow-hidden rounded-t-[var(--r-sheet)] p-0 data-[side=bottom]:h-[94dvh] data-[side=bottom]:max-h-[94dvh]"
        >
          {body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex h-[min(92vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-[34rem]"
      >
        {body}
      </DialogContent>
    </Dialog>
  );
}
