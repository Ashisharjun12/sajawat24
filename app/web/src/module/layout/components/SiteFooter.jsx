import { Link } from "react-router-dom";
import { categoryPath } from "@/lib/catalog-path";
import { DecoryLogo } from "@/components/decory-logo";
import { cn } from "@/lib/utils";
import { DEMO_OCCASIONS } from "@/module/home/data/demo-categories";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { FooterTrustBar } from "@/module/layout/components/FooterTrustBar";
import { SocialIconLink } from "@/module/layout/components/SocialIconLink";
import { FooterGetTheApp } from "@/module/layout/components/FooterGetTheApp";

const COMPANY = [
  { label: "About sajawat24", href: "/support" },
  { label: "Careers", href: "/support" },
  { label: "Become a partner", href: "/support" },
  { label: "Press", href: "/support" },
];

const SUPPORT = [
  { label: "Help centre", href: "/support" },
  { label: "Track order", href: "/support" },
  { label: "Cancellation policy", href: "/support" },
  { label: "Contact us", href: "/support" },
];

function FooterLink({ item, onBrand }) {
  const href = item.href;
  const linkClass = onBrand
    ? "text-primary-foreground/75 transition-colors hover:text-primary-foreground"
    : "text-muted-foreground transition-colors hover:text-foreground";

  if (!href) {
    return (
      <span className={onBrand ? "text-primary-foreground/70" : "text-muted-foreground"}>
        {item.label}
      </span>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link to={href} className={linkClass}>
        {item.label}
      </Link>
    );
  }
  return (
    <a href={href} className={linkClass} target="_blank" rel="noreferrer">
      {item.label}
    </a>
  );
}

function FooterLinks({ title, items, onBrand }) {
  return (
    <div>
      <h5
        className={cn(
          "mb-4 text-sm font-semibold",
          onBrand ? "text-primary-foreground" : "text-foreground",
        )}
      >
        {title}
      </h5>
      <ul className="space-y-2.5 text-sm">
        {(items ?? []).map((item) => (
          <li key={`${title}-${item.label}`}>
            <FooterLink item={item} onBrand={onBrand} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { brand, socialLinks, footerColumns } = useSiteShell();
  const companyName = brand.companyName || "sajawat24";

  const fallbackColumns = [
    {
      title: "Explore",
      links: DEMO_OCCASIONS.map((category) => ({
        label: category.name,
        href: categoryPath(category),
      })),
    },
    { title: "Support", links: SUPPORT },
    { title: "Company", links: COMPANY },
  ];

  const columns = footerColumns.length > 0 ? footerColumns : fallbackColumns;
  const socials = socialLinks.length > 0 ? socialLinks : [];

  return (
    <footer
      className="mt-auto border-t border-primary-foreground/15 bg-primary text-primary-foreground max-md:pb-[calc(var(--mobile-bottom-nav-offset,4.75rem)+env(safe-area-inset-bottom,0px)+1rem)]"
    >
      <FooterTrustBar />
      <div className="mx-auto max-w-[1240px] px-4 pt-14 pb-10 md:px-8 md:pb-12">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 max-w-[320px] flex-1">
          <Link to="/" className="inline-flex shrink-0" aria-label={`${companyName} home`}>
            <DecoryLogo variant="wordmark" className="h-9 sm:h-10" alt={companyName} />
          </Link>
          <p className="mt-3.5 mb-5 text-sm leading-relaxed text-primary-foreground/75">
            {brand.footerDescription}
          </p>
          {(brand.contactPhone || brand.contactEmail || brand.whatsappUrl) ? (
            <div className="mb-5 space-y-1 text-sm text-primary-foreground/75">
              {brand.contactPhone ? <p>{brand.contactPhone}</p> : null}
              {brand.contactEmail ? (
                <p>
                  <a
                    href={`mailto:${brand.contactEmail}`}
                    className="hover:text-primary-foreground"
                  >
                    {brand.contactEmail}
                  </a>
                </p>
              ) : null}
              {brand.whatsappUrl ? (
                <p>
                  <a
                    href={brand.whatsappUrl}
                    className="hover:text-primary-foreground"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Chat on WhatsApp
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
          {socials.length > 0 ? (
            <div className="flex items-center gap-3.5">
              {socials.map((item) => (
                <SocialIconLink
                  key={item.id}
                  link={item}
                  className="text-primary-foreground/80 hover:text-primary-foreground"
                />
              ))}
            </div>
          ) : null}
          </div>
          <div className="shrink-0 pt-0.5 md:hidden">
            <FooterGetTheApp onBrand compact className="items-end" />
          </div>
        </div>
        <div
          className="mt-10 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
        >
          {columns.map((column) => (
            <FooterLinks
              key={column.id ?? column.title}
              title={column.title}
              items={column.links ?? []}
              onBrand
            />
          ))}
        </div>
      </div>
      <div className="relative overflow-hidden border-t border-primary-foreground/15 max-md:min-h-[5.25rem] md:min-h-0">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-2 top-auto translate-y-0 text-center font-heading text-[clamp(3rem,15vw,9rem)] leading-none font-extrabold tracking-tight text-primary-foreground/10 select-none [-webkit-text-stroke:1.5px_rgb(255_255_255_/_0.45)] max-md:pb-0 md:bottom-auto md:top-1/2 md:-translate-y-1/2"
        >
          {companyName}
        </span>
        <div className="relative z-10 mx-auto flex max-w-[1240px] flex-col gap-4 px-4 py-5 text-sm text-primary-foreground/75 max-md:min-h-[5.25rem] max-md:py-0 md:min-h-[7rem] md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6 md:py-8 md:px-8">
          <div className="hidden flex-col gap-1 md:flex">
            <span>© {new Date().getFullYear()} {companyName}</span>
            <span className="text-xs sm:text-sm">All rights reserved.</span>
          </div>
          <div className="hidden md:block">
            <FooterGetTheApp onBrand className="items-end" />
          </div>
        </div>
      </div>
    </footer>
  );
}
