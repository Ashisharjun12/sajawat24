import { useState } from "react";
import { Link } from "react-router-dom";
import { MenuIcon } from "lucide-react";
import { listTopLevelCategories } from "@/lib/category-icons";
import { cn } from "@/lib/utils";
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

        <div className="shrink-0 border-b border-border/70 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Your city</p>
          <LocationPicker variant="mobileToolbar" className="h-10 w-full max-w-full" />
        </div>

        {/* New key per open → menu always starts on the top-level list. */}
        <MobileNavCategories key={openCount} categories={topLevel} onNavigate={close} />

        <div
          className="shrink-0 border-t border-border bg-background px-4 pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {/* Sign out lives at the end of the Account page; the menu only links there. */}
          {user ? (
            <Button
              type="button"
              nativeButton={false}
              className="mb-3 h-11 w-full rounded-[var(--r-btn)] text-base font-semibold"
              render={<Link to="/account" onClick={close} />}
            >
              Manage profile
            </Button>
          ) : (
            <div className="mb-3 flex flex-col gap-2">
              <Button
                type="button"
                className="h-11 w-full rounded-[var(--r-btn)] text-base font-semibold"
                onClick={openLogin}
              >
                Sign up
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-[var(--r-btn)] text-base font-semibold"
                onClick={openLogin}
              >
                Log in
              </Button>
            </div>
          )}
          <Link
            to="/decorations"
            onClick={close}
            className="block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Browse all decorations
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
