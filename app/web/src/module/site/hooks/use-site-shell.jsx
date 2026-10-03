import { createContext, useContext, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { getSiteShell } from "@/api/cms.api";
import { queryKeys } from "@/lib/query-keys";

const EMPTY_SHELL = {
  brand: {
    companyName: "Decorbuddys",
    footerDescription:
      "Affordable decoration in your city—balloons, backdrops, and lights. Book online; instant setups where available.",
    logoLightUrl: null,
    logoDarkUrl: null,
    contactPhone: null,
    contactEmail: null,
    whatsappUrl: null,
  },
  socialLinks: [],
  footerColumns: [],
};

const SHELL_STALE_MS = 15 * 60_000;

const SiteShellContext = createContext({ ...EMPTY_SHELL, loading: true });

export function SiteShellProvider({ children }) {
  const query = useQuery({
    queryKey: queryKeys.siteShell("web"),
    queryFn: () => getSiteShell({ platform: "web" }),
    staleTime: SHELL_STALE_MS,
  });

  const value = useMemo(() => {
    const loading = query.isLoading && query.data === undefined;
    const remote = query.data;
    if (!remote) {
      return { ...EMPTY_SHELL, loading };
    }
    return {
      brand: { ...EMPTY_SHELL.brand, ...remote.brand },
      socialLinks: remote.socialLinks ?? [],
      footerColumns: remote.footerColumns ?? [],
      loading,
    };
  }, [query.data, query.isLoading]);

  return <SiteShellContext.Provider value={value}>{children}</SiteShellContext.Provider>;
}

export function useSiteShell() {
  return useContext(SiteShellContext);
}
