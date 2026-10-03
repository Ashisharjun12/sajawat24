import { useEffect, useMemo, useState } from "react";
import { listProducts } from "@/api/products.api";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { normalizeProduct } from "@/module/home/lib/home-catalog";

const RAIL_LIMIT = 12;
const EXPLORE_FETCH_LIMIT = 24;
const EXPLORE_MAX_ITEMS = 16;

function filterRows(raw, product, variant) {
  return raw.filter((row) => {
    if (row.id === product.id) return false;
    if (variant === "other-categories" && row.categoryId === product.categoryId) {
      return false;
    }
    return true;
  });
}

export function usePdpProductRail(
  product,
  { variant = "same-category", categoryIds = [], enabled = true } = {},
) {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const serviceCityId = isBackendCityId(city?.id) ? city.id : undefined;
  const pincodeCode = pincode?.code || undefined;
  const hasLocation = Boolean(serviceCityId || pincodeCode);

  const categoryIdsKey = categoryIds.join(",");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const canFetch = useMemo(() => {
    if (!enabled || !product?.id || !hasLocation) return false;
    if (variant === "other-categories") return true;
    return categoryIds.length > 0;
  }, [enabled, product?.id, hasLocation, variant, categoryIdsKey]);

  useEffect(() => {
    if (!canFetch) {
      setItems([]);
      setLoading(false);
      return undefined;
    }

    let cancelled = false;
    setLoading(true);

    const limit = variant === "other-categories" ? EXPLORE_FETCH_LIMIT : RAIL_LIMIT;

    void listProducts({
      ...(variant === "other-categories"
        ? { sort: "popularity" }
        : { categoryIds }),
      cityId: pincodeCode ? undefined : serviceCityId,
      pincode: pincodeCode,
      page: 1,
      limit,
    })
      .then((data) => {
        if (cancelled) return;
        let filtered = filterRows(data?.items ?? [], product, variant);
        if (variant === "other-categories") {
          filtered = filtered.slice(0, EXPLORE_MAX_ITEMS);
        }
        setItems(filtered.map(normalizeProduct).filter(Boolean));
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [canFetch, product?.id, product?.categoryId, variant, categoryIdsKey, serviceCityId, pincodeCode]);

  return { items, loading, hasLocation };
}
