import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getHomeCms } from "@/api/cms.api";
import { queryKeys } from "@/lib/query-keys";
import { isBackendCityId, useLocationStore } from "@/store/location.store";
import { useMediaMdDown } from "@/module/catalog/hooks/use-media-md-down";

const EMPTY_CMS = {
  announcements: [],
  announcement: null,
  hero: [],
  mid: [],
  end: [],
  testimonials: [],
  layoutBlocks: [],
  faqs: [],
};

const HOME_STALE_MS = 5 * 60_000;

function normalizeHomeCms(remote) {
  if (!remote) return { ...EMPTY_CMS };

  return {
    announcements: remote.announcements ?? (remote.announcement ? [remote.announcement] : []),
    announcement: remote.announcement ?? null,
    hero: remote.hero ?? [],
    mid: remote.mid ?? [],
    end: remote.end ?? [],
    testimonials: remote.testimonials ?? [],
    layoutBlocks: remote.layoutBlocks ?? [],
    faqs: remote.faqs ?? [],
  };
}

export function useHomeCms() {
  const city = useLocationStore((s) => s.city);
  const pincode = useLocationStore((s) => s.pincode);
  const cityId = isBackendCityId(city?.id) ? city.id : city?.id ?? null;
  const pincodeCode = pincode?.code ?? undefined;
  const backendCityId = isBackendCityId(cityId) ? cityId : undefined;
  const isMdDown = useMediaMdDown();
  const cmsPlatform = isMdDown ? "mobile" : "web";

  const query = useQuery({
    queryKey: queryKeys.cmsHome(backendCityId ?? null, pincodeCode ?? null, cmsPlatform),
    queryFn: () =>
      getHomeCms({
        cityId: backendCityId,
        pincode: pincodeCode,
        platform: cmsPlatform,
      }),
    staleTime: HOME_STALE_MS,
    placeholderData: (previous) => previous,
  });

  const resolved = useMemo(() => normalizeHomeCms(query.data), [query.data]);

  return {
    ...resolved,
    loading: query.isLoading && query.data === undefined,
  };
}

export function useAnnouncementCms() {
  const { announcements } = useHomeCms();
  return announcements ?? [];
}
