import { useEffect, useState } from "react";
import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api";
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  pinLookupMessage,
  pinResolveErrorMessage,
  SELECT_CITY_FIRST_MESSAGE,
} from "@/lib/pin-delivery-message";
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { CheckoutAddressPicker } from "@/module/booking/components/CheckoutAddressPicker";
import { CheckoutDeliveryGeo } from "@/module/booking/components/CheckoutDeliveryGeo";
import { useCartStore } from "@/store/cart.store";
import { useLocationStore } from "@/store/location.store";

function ManualDeliveryFields({ value, onChange, cartCityId, cartCityName }) {
  function patch(partial) {
    onChange({ ...value, ...partial });
  }

  useEffect(() => {
    const code = (value.pincode ?? "").replace(/\D/g, "");
    if (code.length !== 6) {
      if (value.pinStatus !== "idle") {
        patch({
          pinStatus: "idle",
          pinMessage: "",
          cityName: "",
          cityId: null,
        });
      }
      return undefined;
    }

    let cancelled = false;
    patch({ pinStatus: "loading", pinMessage: "" });

    const timer = window.setTimeout(() => {
      if (!cartCityId) {
        patch({
          pinStatus: "error",
          pinMessage: SELECT_CITY_FIRST_MESSAGE,
          cityName: "",
          cityId: null,
        });
        return;
      }
      void resolvePincode(code)
        .then((data) => {
          if (cancelled) return;
          if (!isPincodeDeliverable(data)) {
            patch({
              pinStatus: "error",
              pinMessage: pinLookupMessage(data),
              cityName: data?.city?.name ?? "",
              cityId: data?.city?.id ?? null,
            });
            return;
          }
          if (!isDeliveryPinInCartCity(data, cartCityId)) {
            patch({
              pinStatus: "error",
              pinMessage: deliveryPinCartCityMessage(data, cartCityName ?? "your city"),
              cityName: data?.city?.name ?? "",
              cityId: data?.city?.id ?? null,
            });
            return;
          }
          const city = data.city;
          patch({
            pinStatus: "ok",
            pinMessage: pinLookupMessage(data),
            cityName: city?.name ?? "",
            cityId: cartCityId,
          });
        })
        .catch((err) => {
          if (cancelled) return;
          patch({
            pinStatus: "error",
            pinMessage: pinResolveErrorMessage(err),
            cityName: "",
            cityId: null,
          });
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value.pincode, cartCityId, cartCityName]);

  return (
    <FieldGroup className="gap-4">
      <Field>
        <FieldLabel htmlFor="checkout-pincode">Pincode</FieldLabel>
        <Input
          id="checkout-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="6-digit PIN"
          value={value.pincode}
          onChange={(event) =>
            patch({ pincode: event.target.value.replace(/\D/g, "").slice(0, 6) })
          }
        />
        {value.pinStatus === "loading" ? (
          <Skeleton className="mt-1 h-4 w-44 rounded-md" aria-label="Checking delivery" />
        ) : null}
        {value.pinStatus === "ok" ? (
          <FieldDescription className="text-emerald-700 dark:text-emerald-400">
            {value.pinMessage}
          </FieldDescription>
        ) : null}
        {value.pinStatus === "error" ? (
          <p className="text-sm text-destructive">{value.pinMessage}</p>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="checkout-address">Address</FieldLabel>
        <Textarea
          id="checkout-address"
          autoComplete="street-address"
          placeholder="House / flat, street, area"
          value={value.address}
          onChange={(event) => patch({ address: event.target.value })}
        />
      </Field>
      <Field>
        <FieldLabel htmlFor="checkout-landmark">Landmark (optional)</FieldLabel>
        <Input
          id="checkout-landmark"
          placeholder="Near landmark"
          value={value.landmark}
          onChange={(event) => patch({ landmark: event.target.value })}
        />
      </Field>
    </FieldGroup>
  );
}

function clearDeliveryForManual(value) {
  return {
    ...value,
    address: "",
    landmark: "",
    cityName: "",
    cityId: null,
    pinStatus: "idle",
    pinMessage: "",
    latitude: null,
    longitude: null,
  };
}

export function CheckoutDeliveryStep({
  value,
  onChange,
  cartCityId,
  geoConfirmed,
  onGeoConfirmed,
}) {
  const [useManual, setUseManual] = useState(false);
  const [pinMapOpen, setPinMapOpen] = useState(false);
  const [selectedSavedAddressId, setSelectedSavedAddressId] = useState(null);
  const cart = useCartStore((s) => s.cart);
  const cities = useLocationStore((s) => s.cities);
  const headerCity = useLocationStore((s) => s.city);
  const cartCityName =
    cities.find((c) => c.id === cartCityId)?.name ??
    (headerCity?.id === cartCityId ? headerCity.name : null);
  const requireGeo = cart?.fulfillmentType === "instant";
  const deliveryOk = value.pinStatus === "ok" && value.address.trim().length > 5;
  const setDeliveryGeo = useCartStore((s) => s.setDeliveryGeo);

  function applySavedAddress(address) {
    if (address.latitude != null && address.longitude != null) {
      void setDeliveryGeo({
        latitude: address.latitude,
        longitude: address.longitude,
      })
        .then(() => onGeoConfirmed?.(true))
        .catch(() => onGeoConfirmed?.(false));
      return;
    }
    onGeoConfirmed?.(false);
    if (requireGeo) {
      setPinMapOpen(true);
    }
  }

  function startManualEntry() {
    setUseManual(true);
    setSelectedSavedAddressId(null);
    onChange(clearDeliveryForManual(value));
  }

  function returnToSavedAddresses() {
    setUseManual(false);
    setSelectedSavedAddressId(null);
    onChange(clearDeliveryForManual(value));
  }

  return (
    <div className="flex flex-col gap-6">
      {cartCityName ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-foreground">
          Your order is priced for <span className="font-semibold">{cartCityName}</span>. Use a
          delivery PIN in this city.
        </p>
      ) : null}
      <CheckoutAddressPicker
        value={value}
        onChange={onChange}
        cartCityId={cartCityId}
        cartCityName={cartCityName ?? ""}
        useManual={useManual}
        onUseManualChange={startManualEntry}
        onReturnToSaved={returnToSavedAddresses}
        onExitManual={() => setUseManual(false)}
        onGeoConfirmed={onGeoConfirmed}
        onRequestPinReview={() => setPinMapOpen(true)}
        onSelectedAddressIdChange={setSelectedSavedAddressId}
        onSavedAddressApplied={applySavedAddress}
      />
      {useManual ? (
        <ManualDeliveryFields
          value={value}
          onChange={onChange}
          cartCityId={cartCityId}
          cartCityName={cartCityName}
        />
      ) : null}
      <CheckoutDeliveryGeo
        delivery={value}
        deliveryOk={deliveryOk}
        geoConfirmed={geoConfirmed}
        onGeoConfirmed={onGeoConfirmed}
        onDeliveryCoordsChange={(coords) =>
          onChange({
            ...value,
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
        }
        onDeliveryLocationPreview={(patch) => {
          const pinPatch =
            !selectedSavedAddressId && patch.pincode?.replace(/\D/g, "").length === 6
              ? { pincode: patch.pincode.replace(/\D/g, "").slice(0, 6) }
              : {};
          const addressPatch =
            !selectedSavedAddressId && patch.address?.trim()
              ? { address: patch.address.trim() }
              : {};
          onChange({
            ...value,
            latitude: patch.latitude,
            longitude: patch.longitude,
            ...addressPatch,
            ...pinPatch,
          });
        }}
        requireGeo={requireGeo}
        mapOpen={pinMapOpen}
        onMapOpenChange={setPinMapOpen}
        saveAddressId={selectedSavedAddressId}
      />
    </div>
  );
}
