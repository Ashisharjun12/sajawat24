import { Link, useLocation, useParams } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { getCmsPage } from "@/api/cms.api";
import { MarkdownContent } from "@/components/MarkdownContent";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { queryKeys } from "@/lib/query-keys";
import { useSiteShell } from "@/module/site/hooks/use-site-shell";

export function CmsPagePage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const { brand } = useSiteShell();

  const query = useQuery({
    queryKey: queryKeys.cmsPage(slug),
    queryFn: () => getCmsPage(slug),
    enabled: Boolean(slug),
    retry: false,
  });

  const page = query.data;

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (query.isError || !page) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This page may have been moved or is not published yet.
        </p>
        <Button asChild className="mt-6 rounded-lg">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    );
  }

  const updatedLabel = page.updatedAt
    ? format(new Date(page.updatedAt), "d MMM yyyy")
    : null;

  return (
    <>
      <SeoHead
        title={page.title}
        pathname={pathname}
        siteName={brand.companyName || undefined}
        ogImage={brand.logoLightUrl || brand.logoDarkUrl || undefined}
      />
    <article className="mx-auto max-w-3xl px-4 py-10 md:px-8 md:py-14">
      <header className="mb-8 border-b border-border pb-6">
        <h1 className="font-heading text-3xl font-extrabold tracking-tight md:text-4xl">
          {page.title}
        </h1>
        {updatedLabel ? (
          <p className="mt-2 text-sm text-muted-foreground">Last updated {updatedLabel}</p>
        ) : null}
      </header>
      <MarkdownContent>{page.body}</MarkdownContent>
    </article>
    </>
  );
}
