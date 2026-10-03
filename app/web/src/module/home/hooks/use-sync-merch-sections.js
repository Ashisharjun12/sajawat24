import { useEffect } from "react";
import { listSections } from "@/api/sections.api";
import { normalizeApiSections } from "@/module/home/lib/home-catalog";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { useMerchSectionsStore } from "@/store/merch-sections.store";

export function useSyncMerchSections() {
  const cityId = useLocationStore((s) => s.city?.id);
  const pincode = useLocationStore((s) => s.pincode);
  const locationStatus = useLocationStore((s) => s.status);

  const setLoading = useMerchSectionsStore((s) => s.setLoading);
  const setFromSections = useMerchSectionsStore((s) => s.setFromSections);
  const clear = useMerchSectionsStore((s) => s.clear);

  useEffect(() => {
    if (locationStatus !== "ready") {
      setLoading();
      return;
    }

    const serviceCityId = isBackendCityId(cityId) ? cityId : undefined;
    const pincodeCode = pincode?.code ?? null;

    if (!serviceCityId && !pincodeCode) {
      clear();
      return;
    }

    let cancelled = false;
    setLoading();

    const locationQuery = {
      cityId: serviceCityId,
      pincode: pincodeCode ?? undefined,
    };

    listSections(locationQuery)
      .then((data) => {
        if (cancelled) return;
        const sections = normalizeApiSections(data);
        setFromSections(sections);
      })
      .catch(() => {
        if (cancelled) return;
        clear();
      });

    return () => {
      cancelled = true;
    };
  }, [cityId, pincode, locationStatus, setLoading, setFromSections, clear]);
}
