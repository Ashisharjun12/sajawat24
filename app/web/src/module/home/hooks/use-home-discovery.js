import { useEffect, useMemo, useState } from "react";
import { listProducts } from "@/api/products.api";
import {
  normalizeCategoryTree,
  normalizeProduct,
} from "@/module/home/lib/home-catalog";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { useCatalogStore } from "@/store/catalog.store";
import { useMerchSectionsStore } from "@/store/merch-sections.store";

function catalogFallbackKey(serviceCityId, pincodeCode) {
  return `${serviceCityId ?? ""}:${pincodeCode ?? ""}`;
}

export function useHomeDiscovery() {
  const cityId = useLocationStore((s) => s.city?.id);
  const pincode = useLocationStore((s) => s.pincode);
  const locationStatus = useLocationStore((s) => s.status);

  const merchStatus = useMerchSectionsStore((s) => s.status);
  const merchSections = useMerchSectionsStore((s) => s.sections);

  const [fallbackCache, setFallbackCache] = useState({
    key: null,
    sections: [],
  });

  const serviceCityId = isBackendCityId(cityId) ? cityId : undefined;
  const pincodeCode = pincode?.code ?? null;
  const hasLocation = Boolean(serviceCityId || pincodeCode);

  const shouldFetchCatalogFallback =
    locationStatus === "ready" &&
    merchStatus === "ready" &&
    merchSections.length === 0 &&
    hasLocation;

  const fallbackKey = shouldFetchCatalogFallback
    ? catalogFallbackKey(serviceCityId, pincodeCode)
    : null;

  useEffect(() => {
    if (!fallbackKey) return;

    let cancelled = false;

    const locationQuery = {
      cityId: serviceCityId,
      pincode: pincodeCode ?? undefined,
    };

    listProducts({ ...locationQuery, page: 1, limit: 16 })
      .then((catalog) => {
        if (cancelled) return;
        const items = (catalog?.items ?? [])
          .map(normalizeProduct)
          .filter(Boolean);
        const sections =
          items.length === 0
            ? []
            : [
                {
                  id: "catalog-fallback",
                  slug: "decorations",
                  name: "Popular setups",
                  sortIndex: 0,
                  items,
                },
              ];
        setFallbackCache({ key: fallbackKey, sections });
      })
      .catch(() => {
        if (cancelled) return;
        setFallbackCache({ key: fallbackKey, sections: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [fallbackKey, serviceCityId, pincodeCode]);

  const catalogCategories = useCatalogStore((s) => s.categories);

  const categories = useMemo(
    () => normalizeCategoryTree(catalogCategories),
    [catalogCategories],
  );

  const sections = useMemo(() => {
    if (merchSections.length > 0) return merchSections;
    if (!shouldFetchCatalogFallback && !hasLocation) return [];
    if (shouldFetchCatalogFallback) {
      return fallbackKey && fallbackCache.key === fallbackKey
        ? fallbackCache.sections
        : [];
    }
    return [];
  }, [
    merchSections,
    shouldFetchCatalogFallback,
    hasLocation,
    fallbackKey,
    fallbackCache,
  ]);

  const fallbackPending =
    shouldFetchCatalogFallback && fallbackCache.key !== fallbackKey;

  const loading =
    locationStatus !== "ready" ||
    merchStatus === "loading" ||
    fallbackPending;

  return {
    categories,
    sections,
    loading,
  };
}
