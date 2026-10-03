import { useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { DecoryImageFallback } from "@/components/decory-image-fallback";

function imageSrc(item) {
  return item?.url || item?.publicUrl || item?.optimizedUrl || item?.thumbnailUrl || "";
}

const navBtnClass =
  "absolute top-1/2 z-10 size-11 -translate-y-1/2 rounded-full border-0 bg-black/55 text-white shadow-lg hover:bg-black/70 hover:text-white";

export function ProductGalleryLightbox({
  open,
  onOpenChange,
  images,
  title,
  initialIndex = 0,
}) {
  const [index, setIndex] = useState(initialIndex);

  useEffect(() => {
    if (!open) return;
    setIndex(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open || images.length < 2) return undefined;
    function onKeyDown(event) {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        setIndex((i) => (i - 1 + images.length) % images.length);
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        setIndex((i) => (i + 1) % images.length);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, images.length]);

  const current = images[index] ?? images[0] ?? null;
  const src = imageSrc(current);

  function step(delta) {
    if (images.length < 2) return;
    setIndex((i) => (i + delta + images.length) % images.length);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/80 backdrop-blur-sm"
        className={cn(
          "fixed inset-0 top-0 left-0 z-50 flex h-[100dvh] w-full max-w-none translate-none flex-col gap-0 rounded-none border-0 bg-transparent p-0 shadow-none ring-0 outline-none sm:max-w-none",
        )}
      >
        <DialogTitle className="sr-only">{title} — image gallery</DialogTitle>
        <DialogDescription className="sr-only">
          Product photos. Use arrow keys or side buttons to browse.
        </DialogDescription>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 size-11 rounded-full bg-black/55 text-white hover:bg-black/70 hover:text-white"
          onClick={() => onOpenChange(false)}
          aria-label="Close gallery"
        >
          <XIcon className="size-5" />
        </Button>

        {images.length > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(navBtnClass, "left-3 sm:left-6")}
              onClick={() => step(-1)}
              aria-label="Previous image"
            >
              <ChevronLeftIcon className="size-6" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(navBtnClass, "right-3 sm:right-6")}
              onClick={() => step(1)}
              aria-label="Next image"
            >
              <ChevronRightIcon className="size-6" />
            </Button>
          </>
        ) : null}

        <div className="flex min-h-0 flex-1 items-center justify-center px-14 py-16 sm:px-20">
          <div className="relative flex max-h-full max-w-full flex-col items-center">
            {src ? (
              <img
                src={src}
                alt={title}
                className="max-h-[min(85dvh,900px)] max-w-full object-contain"
                decoding="async"
              />
            ) : (
              <DecoryImageFallback className="min-h-48 w-full max-w-lg" />
            )}
            {images.length > 1 ? (
              <p
                className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-md bg-black/65 px-3 py-1 text-sm font-medium text-white tabular-nums"
              >
                {index + 1} / {images.length}
              </p>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
