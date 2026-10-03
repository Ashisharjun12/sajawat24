import { isPincodeDeliverable, resolvePincode } from '@/api/geo.api';
import {
  deliveryPinCartCityMessage,
  isDeliveryPinInCartCity,
  NOT_DELIVERABLE_MESSAGE,
  pinLookupMessage,
  pinResolveErrorMessage,
} from '@/lib/pin-delivery-message';
import type { AddressDeliveryContext } from '@/module/location/lib/address-delivery-context';
import { useEffect, useState } from 'react';

export type AddressPinStatus = 'idle' | 'loading' | 'ok' | 'error';

type UseAddressPinValidationArgs = {
  pincode: string;
  formCityId: string | null;
  context: AddressDeliveryContext;
  onCityResolved: (city: { id: string; name: string }) => void;
  enabled?: boolean;
};

export function useAddressPinValidation({
  pincode,
  formCityId,
  context,
  onCityResolved,
  enabled = true,
}: UseAddressPinValidationArgs) {
  const [pinStatus, setPinStatus] = useState<AddressPinStatus>('idle');
  const [pinMessage, setPinMessage] = useState('');

  const { contextCityId, contextCityName } = context;

  useEffect(() => {
    if (!enabled) {
      setPinStatus('idle');
      setPinMessage('');
      return;
    }
    const code = pincode.replace(/\D/g, '');
    if (code.length !== 6) {
      setPinStatus('idle');
      setPinMessage('');
      return;
    }

    const scopedCityId = formCityId ?? contextCityId ?? null;

    let cancelled = false;
    setPinStatus('loading');
    const timer = setTimeout(() => {
      const request = scopedCityId
        ? resolvePincode(code, { cityId: scopedCityId })
        : resolvePincode(code);

      void request
        .then((data) => {
          if (cancelled) return;
          if (!isPincodeDeliverable(data)) {
            setPinStatus('error');
            setPinMessage(pinLookupMessage(data as Parameters<typeof pinLookupMessage>[0]));
            return;
          }
          if (contextCityId && !isDeliveryPinInCartCity(data, contextCityId)) {
            setPinStatus('error');
            setPinMessage(
              deliveryPinCartCityMessage(
                data as Parameters<typeof deliveryPinCartCityMessage>[0],
                contextCityName || 'your city',
              ),
            );
            const city = (data as { city?: { id: string; name: string } }).city;
            if (city?.id) {
              onCityResolved({ id: city.id, name: city.name });
            }
            return;
          }
          const city = (data as { city?: { id: string; name: string } }).city;
          if (city?.id && city.name) {
            onCityResolved({ id: city.id, name: city.name });
          }
          setPinStatus('ok');
          setPinMessage(pinLookupMessage(data as Parameters<typeof pinLookupMessage>[0]));
        })
        .catch((err) => {
          if (cancelled) return;
          setPinStatus('error');
          setPinMessage(pinResolveErrorMessage(err));
        });
    }, 280);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [enabled, pincode, formCityId, contextCityId, contextCityName, onCityResolved]);

  function pinValidationError(): string | null {
    const pin = pincode.replace(/\D/g, '');
    const cityId = formCityId ?? contextCityId;
    if (pin.length !== 6) return 'Enter a valid 6-digit PIN code.';
    if (pinStatus === 'loading') return 'Still checking PIN — wait a moment.';
    if (pinStatus === 'error' || pinStatus !== 'ok' || !cityId) {
      return pinMessage || NOT_DELIVERABLE_MESSAGE;
    }
    return null;
  }

  return { pinStatus, pinMessage, pinValidationError };
}
