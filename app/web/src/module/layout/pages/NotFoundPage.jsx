import { Link, useLocation } from "react-router-dom";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { useSiteShell } from "@/module/site/hooks/use-site-shell";

export function NotFoundPage() {
  const { pathname } = useLocation();
  const { brand } = useSiteShell();

  return (
    <>
      <SeoHead
        title="Page not found"
        pathname={pathname}
        siteName={brand.companyName || undefined}
        ogImage={brand.logoLightUrl || brand.logoDarkUrl || undefined}
      />
    <div className="mx-auto flex max-w-lg flex-1 flex-col items-center justify-center px-4 py-24 text-center">
      <p className="font-heading text-6xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        The page you are looking for does not exist or may have been moved.
      </p>
      <Button asChild className="mt-8 rounded-lg">
        <Link to="/">Back to home</Link>
      </Button>
    </div>
    </>
  );
}
