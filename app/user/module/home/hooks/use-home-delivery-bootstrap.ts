import { useDeliveryLocationStore } from '@/store/delivery-location.store';
import { useEffect } from 'react';

/** Hydrates delivery snapshot for header subtitle; no auto navigation to select-location. */
export function useHomeDeliveryBootstrap() {
  const hydrateDelivery = useDeliveryLocationStore((s) => s.hydrate);

  useEffect(() => {
    void hydrateDelivery();
  }, [hydrateDelivery]);
}
