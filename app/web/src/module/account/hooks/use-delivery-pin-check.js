import { useEffect, useState } from "react";
import { isPincodeDeliverable, resolvePincode } from "@/api/geo.api";
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  pinLookupMessage,
  pinResolveErrorMessage,
} from "@/lib/pin-delivery-message";

/**
 * Checks a typed PIN (debounced) against `/geo/resolve`. Only used when the map step could not read
 * a PIN, so the details step asks for it. Returns `{ status, message, city }`;
 * status is "idle" | "loading" | "ok" | "error".
 */
export function useDeliveryPinCheck({
  pincode,
  formCityId = null,
  contextCityId = null,
  contextCityName = "",
  enabled = true,
}) {
  const [state, setState] = useState({ status: "idle", message: "", city: null });

  useEffect(() => {
    const code = (pincode ?? "").replace(/\D/g, "");
    if (!enabled || code.length !== 6) {
      setState({ status: "idle", message: "", city: null });
      return undefined;
    }

    const scopedCityId = formCityId ?? contextCityId ?? null;
    let cancelled = false;
    setState({ status: "loading", message: "", city: null });

    const timer = window.setTimeout(() => {
      const request = scopedCityId
        ? resolvePincode(code, { cityId: scopedCityId })
        : resolvePincode(code);

      void request
        .then((data) => {
          if (cancelled) return;
          if (!isPincodeDeliverable(data)) {
            setState({ status: "error", message: pinLookupMessage(data), city: null });
            return;
          }
          if (contextCityId && !isDeliveryPinInCartCity(data, contextCityId)) {
            setState({
              status: "error",
              message: deliveryPinCartCityMessage(data, contextCityName || "your city"),
              city: null,
            });
            return;
          }
          const city = data.city?.id ? { id: data.city.id, name: data.city.name } : null;
          setState({ status: "ok", message: pinLookupMessage(data), city });
        })
        .catch((err) => {
          if (cancelled) return;
          setState({ status: "error", message: pinResolveErrorMessage(err), city: null });
        });
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [enabled, pincode, formCityId, contextCityId, contextCityName]);

  return state;
}
