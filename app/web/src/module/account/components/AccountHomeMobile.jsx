import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BellIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  LifeBuoyIcon,
  MailIcon,
  MapPinIcon,
  PackageIcon,
  PaletteIcon,
  PenLineIcon,
  RotateCcwIcon,
  ShoppingCartIcon,
  UserRoundIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTheme } from "@/components/ui/theme-provider";
import { WhatsAppIcon } from "@/components/whatsapp-icon";
import { cn } from "@/lib/utils";
import { formatPhonePreview } from "@/module/auth/phone-login";
import { useSiteShell } from "@/module/site/hooks/use-site-shell.jsx";
import { useAuthStore } from "@/store/auth.store";

/** Personal info (name, email, phone, sign-in, sign out). */
export const PERSONAL_INFO_PATH = "/account/profile";

const THEME_OPTIONS = [
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
  { id: "system", label: "System" },
];

/**
 * Account tab list (user app `PROFILE_MENU_SECTIONS`). Orders, wishlist, chat and addresses
 * are the 2 × 2 tiles, so they are not repeated here. Only rows with a web page are listed.
 */
const MENU_SECTIONS = [
  {
    id: "your-account",
    title: "Your account",
    items: [
      { id: "personal-info", label: "Personal info", to: PERSONAL_INFO_PATH, icon: UserRoundIcon },
      { id: "cart", label: "My cart", to: "/bag", icon: ShoppingCartIcon },
      { id: "refunds", label: "Refunds", to: "/account/returns", icon: RotateCcwIcon },
    ],
  },
  {
    id: "preferences",
    title: "Preferences",
    items: [
      { id: "appearance", label: "Appearance", icon: PaletteIcon, action: "appearance" },
      { id: "notifications", label: "Notifications", to: "/account/notifications", icon: BellIcon },
    ],
  },
  {
    id: "support",
    title: "Support",
    items: [{ id: "help", label: "Help", to: "/account/help", icon: LifeBuoyIcon }],
  },
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/** Avatar, name, email/phone and an edit button. The whole card opens Personal info. */
function ProfileHeaderCard({ user }) {
  const name = user.name?.trim() || "Your account";
  const email = user.email?.trim() ?? "";
  const phone = user.phone ? formatPhonePreview(user.phone) : "";

  return (
    <Link
      to={PERSONAL_INFO_PATH}
      aria-label={`${name}. Edit personal info`}
      className="flex items-center gap-4 rounded-[var(--r-card)] border border-border bg-card p-4 transition-colors active:bg-muted/60"
    >
      <Avatar className="size-14 border-2 border-primary/15">
        {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
        <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
          {initials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate font-heading text-lg font-semibold text-foreground">{name}</p>
        {email ? (
          <p className="flex min-w-0 items-center gap-1.5 text-sm text-muted-foreground">
            <MailIcon className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{email}</span>
          </p>
        ) : null}
        {phone ? <p className="truncate text-sm text-muted-foreground">{phone}</p> : null}
        {!email && !phone ? (
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <MailIcon className="size-3.5 shrink-0" aria-hidden />
            Add your contact details
          </p>
        ) : null}
      </div>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <PenLineIcon className="size-4 text-foreground" aria-hidden />
      </span>
    </Link>
  );
}

const TILE_CLASS =
  "flex min-h-14 min-w-0 flex-1 items-center gap-3 rounded-[var(--r-btn)] border border-border bg-card px-3.5 py-3 text-left transition-colors active:bg-muted/60";

function TileContent({ icon: Icon, iconSlot, label }) {
  return (
    <>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[var(--r-btn)] bg-primary/10">
        {iconSlot ?? <Icon className="size-[18px] text-primary" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">{label}</span>
    </>
  );
}

/** 2 × 2 shortcut grid: orders, wishlist, chat, addresses. */
function ProfileQuickActions() {
  const { brand } = useSiteShell();
  const whatsappIcon = <WhatsAppIcon className="size-[18px] text-[#25D366]" />;

  return (
    <div className="grid grid-cols-2 gap-3">
      <Link to="/account/bookings" className={TILE_CLASS}>
        <TileContent icon={PackageIcon} label="My orders" />
      </Link>
      <Link to="/wishlist" className={TILE_CLASS}>
        <TileContent icon={HeartIcon} label="Wishlist" />
      </Link>
      {brand.whatsappUrl ? (
        <a href={brand.whatsappUrl} target="_blank" rel="noopener noreferrer" className={TILE_CLASS}>
          <TileContent iconSlot={whatsappIcon} label="Chat with us" />
        </a>
      ) : (
        // No WhatsApp number configured: the Help page has in-app chat.
        <Link to="/account/help" className={TILE_CLASS}>
          <TileContent iconSlot={whatsappIcon} label="Chat with us" />
        </Link>
      )}
      <Link to="/account/addresses" className={TILE_CLASS}>
        <TileContent icon={MapPinIcon} label="Addresses" />
      </Link>
    </div>
  );
}

const ROW_CLASS = "flex w-full items-center gap-3.5 pl-4 text-left transition-colors active:bg-muted/60";

function MenuRowContent({ icon: Icon, label, subtitle, isLast }) {
  return (
    <>
      <span className="flex size-6 shrink-0 items-center justify-center">
        <Icon className="size-5 text-foreground" aria-hidden />
      </span>
      <span
        className={cn(
          "flex min-h-14 min-w-0 flex-1 items-center gap-2 py-3 pr-4",
          !isLast && "border-b border-border/70",
        )}
      >
        <span className="min-w-0 flex-1 text-[15px] font-medium text-foreground">{label}</span>
        {subtitle ? <span className="shrink-0 text-sm text-muted-foreground">{subtitle}</span> : null}
        <ChevronRightIcon className="size-5 shrink-0 text-muted-foreground/70" aria-hidden />
      </span>
    </>
  );
}

/** Section heading + white card holding divided rows. */
function MenuCard({ title, children }) {
  return (
    <section className="flex flex-col gap-2">
      {title ? (
        <h2 className="px-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h2>
      ) : null}
      <div className="overflow-hidden rounded-[var(--r-card)] border border-border bg-card">
        {children}
      </div>
    </section>
  );
}

function AppearanceSheet({ open, onOpenChange }) {
  const { theme, setTheme } = useTheme();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        <SheetHeader className="px-4 pt-5 pb-2">
          <SheetTitle className="text-lg font-semibold">Appearance</SheetTitle>
        </SheetHeader>
        <div className="flex flex-col px-2 pb-2" role="radiogroup" aria-label="Appearance">
          {THEME_OPTIONS.map((option) => {
            const selected = theme === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setTheme(option.id);
                  onOpenChange(false);
                }}
                className="flex min-h-12 items-center justify-between rounded-[var(--r-btn)] px-3 text-[15px] font-medium text-foreground active:bg-muted/60"
              >
                {option.label}
                {selected ? <CheckIcon className="size-5 text-primary" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Phone layout of /account, matching the user app Account tab:
 * account card → 2 × 2 shortcuts → grouped cards (your account, preferences, support).
 */
export function AccountHomeMobile() {
  const user = useAuthStore((s) => s.user);
  const { theme } = useTheme();
  const [appearanceOpen, setAppearanceOpen] = useState(false);

  if (!user) return null;

  const themeLabel = THEME_OPTIONS.find((option) => option.id === theme)?.label ?? "Light";

  return (
    <div className="flex flex-col gap-6 pb-[calc(var(--mobile-bottom-nav-offset,0px)+1.5rem)]">
      <div className="flex items-center gap-2">
        <Link
          to="/"
          aria-label="Back to home"
          className="-ml-2 flex size-10 items-center justify-center rounded-full active:bg-muted/60"
        >
          <ChevronLeftIcon className="size-6 text-foreground" aria-hidden />
        </Link>
        <h1 className="font-heading text-xl font-semibold tracking-tight text-foreground">
          My Account
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <ProfileHeaderCard user={user} />
        <ProfileQuickActions />
      </div>

      {MENU_SECTIONS.map((section) => (
        <MenuCard key={section.id} title={section.title}>
          {section.items.map((item, index) => {
            const isLast = index === section.items.length - 1;
            if (item.action === "appearance") {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={ROW_CLASS}
                  onClick={() => setAppearanceOpen(true)}
                >
                  <MenuRowContent
                    icon={item.icon}
                    label={item.label}
                    subtitle={themeLabel}
                    isLast={isLast}
                  />
                </button>
              );
            }
            return (
              <Link key={item.id} to={item.to} className={ROW_CLASS}>
                <MenuRowContent icon={item.icon} label={item.label} isLast={isLast} />
              </Link>
            );
          })}
        </MenuCard>
      ))}

      <AppearanceSheet open={appearanceOpen} onOpenChange={setAppearanceOpen} />
    </div>
  );
}
