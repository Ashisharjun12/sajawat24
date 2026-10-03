import { useEffect, useState } from "react";
import { listAvailableCoupons } from "@/api/promotions.api";
import { isBackendCityId, useLocationStore } from "@/store/location.store";

export function useAvailableCoupons({ productId, categoryId, scope = "product" } = {}) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const serviceCityId = isBackendCityId(city?.id) ? city.id : undefined;
    const pincodeCode = pincode?.code || undefined;
    if (!serviceCityId && !pincodeCode) {
      setCoupons([]);
      setLoading(false);
      return undefined;
    }

    if (scope === "product" && (!productId || !categoryId)) {
      setCoupons([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    void listAvailableCoupons({
      productId: scope === "product" ? productId : productId || undefined,
      categoryId: scope === "product" ? categoryId : categoryId || undefined,
      scope,
      cityId: pincodeCode ? undefined : serviceCityId,
      pincode: pincodeCode,
    })
      .then((data) => {
        if (cancelled) return;
        setCoupons(Array.isArray(data?.items) ? data.items : []);
      })
      .catch(() => {
        if (!cancelled) setCoupons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [productId, categoryId, scope, city?.id, pincode?.code]);

  return { coupons, loading };
}
