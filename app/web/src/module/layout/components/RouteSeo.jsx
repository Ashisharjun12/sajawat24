import { useLocation } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { defaultSeoForPath } from "@/lib/site-seo";
import { useSiteShell } from "@/module/site/hooks/use-site-shell";

/**
 * Baseline SEO for routes without a page-specific SeoHead override.
 * Pages that render their own SeoHead should set a more specific title when data loads.
 */
export function RouteSeo() {
  const { pathname } = useLocation();
  const { brand } = useSiteShell();
  const siteName = brand.companyName || undefined;
  const defaults = defaultSeoForPath(pathname);

  return (
    <SeoHead
      title={defaults.title}
      description={defaults.description}
      pathname={pathname}
      noindex={defaults.noindex}
      ogImage={brand.logoLightUrl || brand.logoDarkUrl || undefined}
      siteName={siteName}
    />
  );
}
