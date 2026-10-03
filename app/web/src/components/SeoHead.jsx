import { Helmet } from "react-helmet-async";
import {
  DEFAULT_DESCRIPTION,
  SITE_NAME,
  canonicalUrl,
  formatPageTitle,
  truncateDescription,
} from "@/lib/site-seo";

export function SeoHead({
  title,
  description,
  pathname = "/",
  noindex = false,
  ogImage,
  siteName = SITE_NAME,
}) {
  const pageTitle = formatPageTitle(title, siteName);
  const metaDescription = truncateDescription(description ?? DEFAULT_DESCRIPTION);
  const canonical = canonicalUrl(pathname);
  const robots = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet>
      <title>{pageTitle}</title>
      <meta name="description" content={metaDescription} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />
      <meta property="og:title" content={pageTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={siteName} />
      {ogImage ? <meta property="og:image" content={ogImage} /> : null}
      <meta name="twitter:card" content={ogImage ? "summary_large_image" : "summary"} />
      <meta name="twitter:title" content={pageTitle} />
      <meta name="twitter:description" content={metaDescription} />
      {ogImage ? <meta name="twitter:image" content={ogImage} /> : null}
    </Helmet>
  );
}
