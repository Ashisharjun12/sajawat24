import { useCallback, useEffect, useRef, useState } from "react";
import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api";
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  pinLookupMessage,
  pinResolveErrorMessage,
} from "@/lib/pin-delivery-message";
import { reverseGeocodeLocation } from "@/lib/reverse-geocode";
import { isInsideIndiaBounds } from "@/module/geo/lib/india-map";

const SETTLE_MS = 450;

const EMPTY = { status: "idle", title: "", line: "", pincode: "", city: null, message: "" };

/**
 * What is under the map pin? Waits for the pin to settle, reads the address (reverse geocode) and
 * checks the PIN is deliverable. Only the latest request may update the result, so quickly moving
 * the pin never shows an older spot.
 *
 * status: "idle" (nothing picked yet) | "locating" | "ready" | "blocked" | "error"
 * A "ready" result with an empty `pincode` means the map data had no PIN: the details step asks.
 */
export function usePinnedLocation({
  latitude,
  longitude,
  enabled,
  contextCityId = null,
  contextCityName = "",
}) {
  const [state, setState] = useState(EMPTY);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      requestRef.current += 1;
      setState(EMPTY);
      return undefined;
    }

    if (!isInsideIndiaBounds(latitude, longitude)) {
      requestRef.current += 1;
      setState({ ...EMPTY, status: "blocked", message: "We deliver only within India." });
      return undefined;
    }

    const requestId = ++requestRef.current;
    setState((prev) => ({ ...prev, status: "locating", message: "" }));

    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const row = await reverseGeocodeLocation(latitude, longitude);
          if (requestId !== requestRef.current) return;

          const title = row.placeName?.trim() || row.cityName?.trim() || "Selected location";
          const line = (row.formattedAddress || row.address || "").trim();
          const pin = String(row.pincode ?? "").replace(/\D/g, "").slice(0, 6);

          if (pin.length !== 6) {
            setState({
              status: "ready",
              title,
              line,
              pincode: "",
              city: contextCityId ? { id: contextCityId, name: contextCityName } : null,
              message: "",
            });
            return;
          }

          const lookup = contextCityId
            ? await resolvePincode(pin, { cityId: contextCityId })
            : await resolvePincode(pin);
          if (requestId !== requestRef.current) return;

          if (!isPincodeDeliverable(lookup)) {
            setState({
              status: "blocked",
              title,
              line,
              pincode: pin,
              city: null,
              message: pinLookupMessage(lookup),
            });
            return;
          }
          if (contextCityId && !isDeliveryPinInCartCity(lookup, contextCityId)) {
            setState({
              status: "blocked",
              title,
              line,
              pincode: pin,
              city: null,
              message: deliveryPinCartCityMessage(lookup, contextCityName || "your city"),
            });
            return;
          }

          const city = lookup?.city;
          setState({
            status: "ready",
            title,
            line,
            pincode: pin,
            city: city?.id && city.name ? { id: city.id, name: city.name } : null,
            message: "",
          });
        } catch (err) {
          if (requestId !== requestRef.current) return;
          setState({
            ...EMPTY,
            status: "error",
            message: pinResolveErrorMessage(err) || "Couldn't read this spot. Try again.",
          });
        }
      })();
    }, SETTLE_MS);

    return () => window.clearTimeout(timer);
  }, [enabled, latitude, longitude, contextCityId, contextCityName, retryNonce]);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return { ...state, retry };
}
