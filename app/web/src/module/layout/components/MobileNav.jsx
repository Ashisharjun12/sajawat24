import { useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon, UserRoundIcon } from "lucide-react";
import { listTopLevelCategories } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MobileNavCategories } from "@/module/layout/components/MobileNavCategories";
import { LocationPicker } from "@/module/layout/components/LocationPicker";
import { useAuthStore } from "@/store/auth.store";
import { useCatalogStore } from "@/store/catalog.store";

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

/**
 * Top of the menu. Signed in: Google avatar (initials fallback), "Welcome, {first name}!",
 * email, and the Account button. Signed out: guest welcome with Sign up / Log in.
 * Sign out lives at the end of Personal info (/account/profile), not here.
 */
function MobileNavWelcomeCard({ user, onNavigate, onLogin }) {
  const cardClass = "rounded-[var(--r-card)] border border-border bg-card p-3.5 shadow-sm";
  const buttonClass = "h-10 w-full rounded-[var(--r-btn)] text-sm font-semibold";

  if (!user) {
    return (
      <div className={cardClass}>
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <UserRoundIcon className="size-5 text-primary" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-heading text-[15px] font-semibold text-foreground">Welcome, Guest!</p>
            <p className="text-xs text-muted-foreground">
              Sign in for orders, wishlist and addresses.
            </p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button type="button" className={buttonClass} onClick={onLogin}>
            Sign up
          </Button>
          <Button type="button" variant="outline" className={buttonClass} onClick={onLogin}>
            Log in
          </Button>
        </div>
      </div>
    );
  }

  const name = user.name?.trim() ?? "";
  const firstName = name.split(/\s+/)[0] || "there";
  const contact = user.email?.trim() || user.phone?.trim() || "";

  return (
    <div className={cardClass}>
      <div className="flex items-center gap-3">
        <Avatar className="size-11 border-2 border-primary/15">
          {user.avatar ? (
            // Google profile photos can refuse requests that send a Referer header.
            <AvatarImage src={user.avatar} alt="" referrerPolicy="no-referrer" />
          ) : null}
          <AvatarFallback className="bg-primary/10 font-semibold text-primary">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-heading text-[15px] font-semibold text-foreground">
            Welcome, {firstName}!
          </p>
          {contact ? (
            <p className="truncate text-xs text-muted-foreground">{contact}</p>
          ) : null}
        </div>
      </div>
      <Button
        type="button"
        nativeButton={false}
        className={cn(buttonClass, "mt-3")}
        render={<Link to="/account" onClick={onNavigate} />}
      >
        Account
      </Button>
    </div>
  );
}

export function MobileNav({ triggerClassName }) {
  const [open, setOpenState] = useState(false);
  const [openCount, setOpenCount] = useState(0);
  const user = useAuthStore((s) => s.user);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const categories = useCatalogStore((s) => s.categories);
  const topLevel = listTopLevelCategories(categories);

  function setOpen(next) {
    if (next && !open) setOpenCount((n) => n + 1);
    setOpenState(next);
  }

  function close() {
    setOpen(false);
  }

  function openLogin() {
    close();
    setLoginOpen(true);
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className={cn("size-9 shrink-0 md:hidden", triggerClassName)}
          />
        }
      >
        <MenuIcon />
        <span className="sr-only">Open menu</span>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-[100dvh] w-[min(100vw,21rem)] max-w-[88vw] flex-col gap-0 p-0 sm:max-w-sm"
      >
        <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
          <SheetTitle className="font-heading text-base">Menu</SheetTitle>
        </SheetHeader>

        <div className="shrink-0 px-4 pt-4">
          <MobileNavWelcomeCard user={user} onNavigate={close} onLogin={openLogin} />
        </div>

        <div className="shrink-0 border-b border-border/70 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Your city</p>
          <LocationPicker variant="mobileToolbar" className="h-10 w-full max-w-full" />
        </div>

        {/* New key per open → menu always starts on the top-level list. */}
        <MobileNavCategories key={openCount} categories={topLevel} onNavigate={close} />

        {/* Keeps the last category clear of the phone's home indicator. */}
        <div className="h-[env(safe-area-inset-bottom)] shrink-0" aria-hidden />
      </SheetContent>
    </Sheet>
  );
}
