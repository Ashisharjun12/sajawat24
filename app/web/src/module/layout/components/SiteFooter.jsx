import { Link } from "react-router-dom";
import { categoryPath } from "@/lib/catalog-path";
import { DecoryLogo } from "@/components/decory-logo";
import { DEMO_OCCASIONS } from "@/module/home/data/demo-categories";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { FooterTrustBar } from "@/module/layout/components/FooterTrustBar";
import { SocialIconLink } from "@/module/layout/components/SocialIconLink";
import { FooterGetTheApp } from "@/module/layout/components/FooterGetTheApp";

const COMPANY = [
  { label: "About Decoryy", href: "/support" },
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

function FooterLink({ item }) {
  const href = item.href;
  if (!href) {
    return <span className="text-muted-foreground">{item.label}</span>;
  }
  if (href.startsWith("/")) {
    return (
      <Link to={href} className="text-muted-foreground transition-colors hover:text-foreground">
        {item.label}
      </Link>
    );
  }
  return (
    <a
      href={href}
      className="text-muted-foreground transition-colors hover:text-foreground"
      target="_blank"
      rel="noreferrer"
    >
      {item.label}
    </a>
  );
}

function FooterLinks({ title, items }) {
  return (
    <div>
      <h5 className="mb-4 text-sm font-semibold text-foreground">{title}</h5>
      <ul className="space-y-2.5 text-sm">
        {(items ?? []).map((item) => (
          <li key={`${title}-${item.label}`}>
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SiteFooter() {
  const { brand, socialLinks, footerColumns } = useSiteShell();
  const companyName = brand.companyName || "Decoryy";

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
    <footer className="mt-auto border-t border-border bg-background text-foreground">
      <FooterTrustBar />
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-4 pt-14 pb-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <DecoryLogo
              lightSrc={brand.logoLightUrl}
              darkSrc={brand.logoDarkUrl}
              alt={companyName}
            />
            <span className="font-heading text-[21px] font-extrabold tracking-tight">
              {companyName}
            </span>
          </div>
          <p className="mt-3.5 mb-5 max-w-[280px] text-sm leading-relaxed text-muted-foreground">
            {brand.footerDescription}
          </p>
          {(brand.contactPhone || brand.contactEmail || brand.whatsappUrl) ? (
            <div className="mb-5 space-y-1 text-sm text-muted-foreground">
              {brand.contactPhone ? <p>{brand.contactPhone}</p> : null}
              {brand.contactEmail ? (
                <p>
                  <a href={`mailto:${brand.contactEmail}`} className="hover:text-foreground">
                    {brand.contactEmail}
                  </a>
                </p>
              ) : null}
              {brand.whatsappUrl ? (
                <p>
                  <a href={brand.whatsappUrl} className="hover:text-foreground" target="_blank" rel="noreferrer">
                    Chat on WhatsApp
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}
          {socials.length > 0 ? (
            <div className="flex items-center gap-3.5">
              {socials.map((item) => (
                <SocialIconLink key={item.id} link={item} />
              ))}
            </div>
          ) : null}
        </div>
        {columns.map((column) => (
          <FooterLinks
            key={column.id ?? column.title}
            title={column.title}
            items={column.links ?? []}
          />
        ))}
      </div>
      <div className="relative overflow-hidden border-t border-border">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-heading text-[clamp(4.5rem,18vw,9rem)] leading-none font-extrabold tracking-tight text-transparent select-none [-webkit-text-stroke:1px_var(--border)]"
        >
          {companyName}
        </span>
        <div className="relative z-10 mx-auto flex max-w-[1240px] min-h-[5.5rem] flex-col gap-6 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-end sm:justify-between md:min-h-[7rem] md:px-8">
          <div className="flex flex-col gap-1 sm:gap-0">
            <span>© {new Date().getFullYear()} {companyName}</span>
            <span className="text-xs sm:text-sm">All rights reserved.</span>
          </div>
          <FooterGetTheApp />
        </div>
      </div>
    </footer>
  );
}
