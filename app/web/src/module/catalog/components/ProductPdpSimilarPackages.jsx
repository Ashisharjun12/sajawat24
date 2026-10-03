import { Link } from "react-router-dom";
import { ArrowRightIcon, SparklesIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useMediaMdDown } from "@/module/catalog/hooks/use-media-md-down";
import { usePdpSimilarPackages } from "@/module/catalog/hooks/use-pdp-similar-packages";
import { useLockPageScrollWhen } from "@/lib/use-lock-page-scroll";
import {
  HomeProductCardCompact,
  HomeProductCardSkeleton,
} from "@/module/home/components/HomeProductCard";
import { useLocationStore } from "@/store/location.store";

function SimilarPackagesBody({ product, enabled, onNavigate }) {
  const setPickerOpen = useLocationStore((s) => s.setPickerOpen);
  const { meta, items, loading, hasLocation } = usePdpSimilarPackages(product, { enabled });

  if (!meta) {
    return (
      <p className="px-4 py-8 text-center text-sm text-muted-foreground">
        Similar packages are not available for this setup.
      </p>
    );
  }

  if (!hasLocation) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          Choose your city to see similar packages and local prices.
        </p>
        <Button type="button" className="rounded-full" onClick={() => setPickerOpen(true)}>
          Choose city
        </Button>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-3 [-webkit-overflow-scrolling:touch]"
        data-lenis-prevent
      >
        <span
          className="mb-3 inline-flex rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold text-foreground"
        >
          {meta.categoryLabel}
        </span>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <HomeProductCardSkeleton key={index} compact />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No similar packages right now. Browse the full category instead.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item) => (
              <HomeProductCardCompact
                key={item.id}
                product={item}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        )}
      </div>

      {meta.viewAllHref ? (
        <div className="shrink-0 border-t border-border/80 px-4 py-3">
          <Button
            type="button"
            nativeButton={false}
            className="h-11 w-full rounded-full bg-primary text-sm font-semibold text-black hover:bg-primary/85"
            render={
              <Link
                to={meta.viewAllHref}
                onClick={onNavigate}
                className="inline-flex items-center justify-center gap-2"
              >
                {meta.viewAllLabel}
                <ArrowRightIcon className="size-4 shrink-0" aria-hidden />
              </Link>
            }
          />
        </div>
      ) : null}
    </>
  );
}

function SimilarPackagesHeader({ onClose, className }) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
            aria-hidden
          >
            <SparklesIcon className="size-4" />
          </span>
          <h2 className="font-heading text-lg font-semibold tracking-tight">Similar packages</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">More setups you may like</p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="shrink-0 rounded-full"
        onClick={onClose}
        aria-label="Close"
      >
        <XIcon className="size-4" />
      </Button>
    </div>
  );
}

export function ProductPdpSimilarGalleryButton({ className, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-md ring-1 ring-black/5 backdrop-blur-sm transition-colors hover:bg-white dark:bg-background/95",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      aria-label="Similar packages"
    >
      <SparklesIcon className="size-3.5 text-primary" aria-hidden />
      Similar
    </button>
  );
}

export function ProductPdpSimilarPackages({ product, open, onOpenChange }) {
  const isMdDown = useMediaMdDown();
  const canShow = Boolean(product?.id && product?.categoryId);

  useLockPageScrollWhen(open && canShow);

  function close() {
    onOpenChange(false);
  }

  if (!canShow) return null;

  const body = (
    <SimilarPackagesBody
      product={product}
      enabled={open}
      onNavigate={close}
    />
  );

  if (isMdDown) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[min(88dvh,40rem)] max-h-[min(88dvh,40rem)] flex-col gap-0 overflow-hidden rounded-t-3xl border-t p-0"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Similar packages</SheetTitle>
            <SheetDescription>More setups like this one</SheetDescription>
          </SheetHeader>
          <div className="shrink-0 border-b border-border/60 px-4 py-4">
            <SimilarPackagesHeader onClose={close} />
          </div>
          <div className="flex min-h-0 flex-1 flex-col">{body}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="top-[10vh] flex h-[min(85vh,40rem)] max-h-[min(85vh,40rem)] w-[min(100%-2rem,32rem)] max-w-lg translate-y-0 flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg"
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Similar packages</DialogTitle>
          <DialogDescription>More setups like this one</DialogDescription>
        </DialogHeader>
        <div className="shrink-0 border-b border-border/60 px-5 py-4">
          <SimilarPackagesHeader onClose={close} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
