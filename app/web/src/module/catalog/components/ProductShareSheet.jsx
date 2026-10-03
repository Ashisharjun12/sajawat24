import { useMemo } from "react";
import {
  CopyIcon,
  MailIcon,
  Share2Icon,
  SmartphoneIcon,
} from "lucide-react";
import { productPath } from "@/lib/catalog-path";
import { canonicalUrl } from "@/lib/site-seo";
import {
  buildProductShareMessage,
  canUseNativeShare,
  copyProductLink,
  shareNative,
  shareViaEmail,
  shareViaWhatsApp,
} from "@/lib/share-product";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";

function WhatsAppShareIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"
      />
    </svg>
  );
}

function ShareActionButton({ icon, label, iconClassName, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/80"
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full bg-muted",
          iconClassName,
        )}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 text-foreground">{label}</span>
    </button>
  );
}

function ShareActionList({ title, shareUrl, onClose }) {
  const message = buildProductShareMessage(title, shareUrl);
  const showNative = canUseNativeShare();

  async function onCopy() {
    try {
      await copyProductLink(shareUrl);
      toast.add({ title: "Link copied", type: "success" });
      onClose?.();
    } catch {
      toast.add({ title: "Could not copy link", type: "error" });
    }
  }

  async function onNativeShare() {
    try {
      await shareNative({ title, url: shareUrl });
      onClose?.();
    } catch (err) {
      if (err?.name === "AbortError") return;
      toast.add({ title: "Could not share", type: "error" });
    }
  }

  return (
    <ul className="flex flex-col gap-0.5 pb-1">
      <li>
        <ShareActionButton
          label="WhatsApp"
          iconClassName="bg-[#25D366]/15 text-[#1DA851]"
          icon={<WhatsAppShareIcon className="size-5" />}
          onClick={() => {
            shareViaWhatsApp(message);
            onClose?.();
          }}
        />
      </li>
      <li>
        <ShareActionButton
          label="Copy link"
          icon={<CopyIcon className="size-5" />}
          onClick={() => void onCopy()}
        />
      </li>
      {showNative ? (
        <li>
          <ShareActionButton
            label="More options"
            icon={<SmartphoneIcon className="size-5" />}
            onClick={() => void onNativeShare()}
          />
        </li>
      ) : null}
      <li>
        <ShareActionButton
          label="Email"
          icon={<MailIcon className="size-5" />}
          onClick={() => {
            shareViaEmail(title, message);
            onClose?.();
          }}
        />
      </li>
    </ul>
  );
}

function SharePanelBody({ title, shareUrl, onClose }) {
  return (
    <>
      <p className="mb-3 truncate px-1 text-xs text-muted-foreground" title={shareUrl}>
        {shareUrl}
      </p>
      <ShareActionList title={title} shareUrl={shareUrl} onClose={onClose} />
    </>
  );
}

export function ProductShareTrigger({ className, onClick, ...props }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      className={cn(
        "size-10 shrink-0 rounded-full border-border/80 bg-background shadow-sm",
        className,
      )}
      aria-label="Share"
      onClick={onClick}
      {...props}
    >
      <Share2Icon className="size-[1.15rem]" aria-hidden />
    </Button>
  );
}

export function ProductShareGalleryTrigger({ className, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/95 text-foreground shadow-md ring-1 ring-black/5 dark:bg-background/95",
        className,
      )}
      aria-label="Share"
    >
      <Share2Icon className="size-5" aria-hidden />
    </button>
  );
}

export function ProductShareSheet({
  open,
  onOpenChange,
  title,
  productId,
  shareUrl: shareUrlProp,
}) {
  const isMobile = useIsMobile();
  const shareUrl = useMemo(() => {
    if (shareUrlProp) return shareUrlProp;
    if (!productId) return canonicalUrl("/");
    return canonicalUrl(productPath(productId));
  }, [productId, shareUrlProp]);

  const displayTitle = (title ?? "").trim() || "Share this setup";

  function close() {
    onOpenChange(false);
  }

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down">
        <DrawerContent
          className="z-[60] max-h-[min(24rem,85dvh)] rounded-t-3xl border-t pb-[max(0.75rem,env(safe-area-inset-bottom))] [--drawer-inset:0px]"
        >
          <div className="px-5 pt-2 pb-4">
            <DrawerTitle className="font-heading text-lg font-semibold tracking-tight">
              Share
            </DrawerTitle>
            <DrawerDescription className="mt-1 line-clamp-2 text-sm">
              {displayTitle}
            </DrawerDescription>
            <div className="mt-4">
              <SharePanelBody title={title} shareUrl={shareUrl} onClose={close} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="z-[60] sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading text-lg font-semibold">Share</DialogTitle>
          <DialogDescription className="line-clamp-2">{displayTitle}</DialogDescription>
        </DialogHeader>
        <SharePanelBody title={title} shareUrl={shareUrl} onClose={close} />
      </DialogContent>
    </Dialog>
  );
}
