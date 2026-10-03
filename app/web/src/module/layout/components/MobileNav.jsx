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
import { HomeCategoryTile } from "@/module/home/components/HomeCategoryTile";
import { LocationPicker } from "@/module/layout/components/LocationPicker";
import { UserMenu } from "@/module/layout/components/UserMenu";
import { useAuthStore } from "@/store/auth.store";
import { useCatalogStore } from "@/store/catalog.store";

export function MobileNav({ triggerClassName }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const setLoginOpen = useAuthStore((s) => s.setLoginOpen);
  const categories = useCatalogStore((s) => s.categories);
  const topLevel = listTopLevelCategories(categories);

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

        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4"
          data-lenis-prevent
        >
          <p className="mb-3 px-1 text-xs font-medium text-muted-foreground">Categories</p>
          <nav className="grid grid-cols-3 gap-x-2 gap-y-4">
            {topLevel.map((category) => (
              <HomeCategoryTile
                key={category.id}
                category={category}
                navigation="link"
                compact
                squareImage
                onNavigate={close}
              />
            ))}
          </nav>
        </div>

        <div
          className="shrink-0 border-t border-border bg-background px-4 pt-3"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          {user ? (
            <UserMenu variant="sheet" onNavigate={close} />
          ) : (
            <div className="flex flex-col gap-2">
              <Button
                type="button"
                className="h-11 w-full rounded-full bg-primary text-base font-semibold text-black hover:bg-primary/85"
                onClick={openLogin}
              >
                Sign up
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full rounded-full text-base font-semibold"
                onClick={openLogin}
              >
                Log in
              </Button>
            </div>
          )}
          <Link
            to="/decorations"
            onClick={close}
            className="mt-3 block text-center text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Browse all decorations
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}
