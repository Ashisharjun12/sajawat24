import { isPincodeDeliverable, resolvePincode } from '@/api/geo.api';
import { reverseGeocode } from '@/api/maps.api';
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  pinLookupMessage,
  pinResolveErrorMessage,
} from '@/lib/pin-delivery-message';
import { isInsideIndiaBounds } from '@/module/geo/lib/india-map';
import type { AddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { useCallback, useEffect, useRef, useState } from 'react';

const SETTLE_MS = 450;

export type PinnedLocationStatus =
  /** Nothing picked yet (no pin movement, search or GPS). */
  | 'idle'
  /** Looking up the spot under the pin. */
  | 'locating'
  /** Address read and the area is deliverable (or the PIN still has to be entered). */
  | 'ready'
  /** Address read but we cannot deliver here / outside India. */
  | 'blocked'
  /** The lookup itself failed (network, server). */
  | 'error';

export type PinnedLocation = {
  status: PinnedLocationStatus;
  /** Bold place name, e.g. "Sandalpur Road". */
  title: string;
  /** Full line, e.g. "Bajrangpuri, Patna". */
  line: string;
  /** 6 digits, or '' when the map data had none (the details form then asks for it). */
  pincode: string;
  city: { id: string; name: string } | null;
  /** Why it is blocked / failed, in plain words. */
  message: string;
};

const EMPTY: PinnedLocation = {
  status: 'idle',
  title: '',
  line: '',
  pincode: '',
  city: null,
  message: '',
};

type ReverseRow = {
  placeName?: string | null;
  formattedAddress?: string;
  cityName?: string | null;
  pincode?: string | null;
};

type PinLookup = {
  deliverable?: boolean;
  city?: { id?: string; name?: string };
};

/**
 * What is under the map pin? Waits for the pin to settle, reads the address (reverse geocode) and
 * checks the PIN is deliverable. Only the latest request may update the result, so quickly moving
 * the pin never shows an older spot.
 */
export function usePinnedLocation(args: {
  latitude: number;
  longitude: number;
  /** false until the user has actually picked something (avoids reading a random spot of India). */
  enabled: boolean;
  context: AddressDeliveryContext;
}) {
  const { latitude, longitude, enabled, context } = args;
  const { contextCityId, contextCityName } = context;
  const [state, setState] = useState<PinnedLocation>(EMPTY);
  const [retryNonce, setRetryNonce] = useState(0);
  const requestRef = useRef(0);

  useEffect(() => {
    if (!enabled) {
      requestRef.current += 1;
      setState(EMPTY);
      return;
    }

    if (!isInsideIndiaBounds(latitude, longitude)) {
      requestRef.current += 1;
      setState({ ...EMPTY, status: 'blocked', message: 'We deliver only within India.' });
      return;
    }

    const requestId = ++requestRef.current;
    setState((prev) => ({ ...prev, status: 'locating', message: '' }));

    const timer = setTimeout(() => {
      void (async () => {
        try {
          const row = (await reverseGeocode(latitude, longitude)) as ReverseRow;
          if (requestId !== requestRef.current) return;

          const title = row.placeName?.trim() || row.cityName?.trim() || 'Selected location';
          const line = row.formattedAddress?.trim() || '';
          const pin = (row.pincode ?? '').replace(/\D/g, '').slice(0, 6);

          if (pin.length !== 6) {
            // Map data without a PIN: let the user continue and type it on the next screen.
            setState({
              status: 'ready',
              title,
              line,
              pincode: '',
              city: contextCityId ? { id: contextCityId, name: contextCityName } : null,
              message: '',
            });
            return;
          }

          const lookup = (await (contextCityId
            ? resolvePincode(pin, { cityId: contextCityId })
            : resolvePincode(pin))) as PinLookup | null;
          if (requestId !== requestRef.current) return;

          if (!isPincodeDeliverable(lookup)) {
            setState({
              status: 'blocked',
              title,
              line,
              pincode: pin,
              city: null,
              message: pinLookupMessage(lookup as Parameters<typeof pinLookupMessage>[0]),
            });
            return;
          }
          if (contextCityId && !isDeliveryPinInCartCity(lookup, contextCityId)) {
            setState({
              status: 'blocked',
              title,
              line,
              pincode: pin,
              city: null,
              message: deliveryPinCartCityMessage(
                lookup as Parameters<typeof deliveryPinCartCityMessage>[0],
                contextCityName || 'your city',
              ),
            });
            return;
          }

          const city = lookup?.city;
          setState({
            status: 'ready',
            title,
            line,
            pincode: pin,
            city: city?.id && city.name ? { id: city.id, name: city.name } : null,
            message: '',
          });
        } catch (err) {
          if (requestId !== requestRef.current) return;
          setState({
            ...EMPTY,
            status: 'error',
            message: pinResolveErrorMessage(err) || "Couldn't read this spot. Try again.",
          });
        }
      })();
    }, SETTLE_MS);

    return () => clearTimeout(timer);
  }, [enabled, latitude, longitude, contextCityId, contextCityName, retryNonce]);

  const retry = useCallback(() => setRetryNonce((n) => n + 1), []);

  return { ...state, retry };
}
