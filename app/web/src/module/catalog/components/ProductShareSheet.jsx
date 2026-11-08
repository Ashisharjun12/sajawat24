import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckIcon,
  CopyIcon,
  Link2Icon,
  MailIcon,
  MessageSquareTextIcon,
  MoreHorizontalIcon,
  SendIcon,
  Share2Icon,
} from "lucide-react";
import { productPath } from "@/lib/catalog-path";
import { formatPaise } from "@/lib/money";
import { canonicalUrl } from "@/lib/site-seo";
import {
  buildProductShareMessage,
  canUseNativeShare,
  copyProductLink,
  shareNative,
  shareViaEmail,
  shareViaFacebook,
  shareViaSms,
  shareViaTelegram,
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

const COPIED_MS = 1800;

function WhatsAppShareIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

/** Facebook "f" (lucide has no brand icons). */
function FacebookGlyph({ className }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        d="M14 8.5V6.8c0-.8.2-1.3 1.4-1.3H17V2.6c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v1.7H7.6v3.3h2.7V21h3.7v-9.2h2.8l.4-3.3H14z"
        fill="#ffffff"
      />
    </svg>
  );
}

/** Round app target: coloured circle + label (same as the app). */
function ShareTarget({ label, bg, fg = "#ffffff", children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-[68px] shrink-0 flex-col items-center gap-1.5 rounded-xl py-1 transition-transform active:scale-95"
      aria-label={`Share via ${label}`}
    >
      <span
        className="flex size-14 items-center justify-center rounded-full transition-shadow group-hover:shadow-md"
        style={{ backgroundColor: bg, color: fg }}
      >
        {children}
      </span>
      <span className="w-full truncate text-center text-xs font-medium text-foreground">{label}</span>
    </button>
  );
}

/**
 * Same layout as the app share sheet: product preview → link field with inline
 * Copy ("Copied ✓", stays open) → "Share via" row of round app targets.
 */
function SharePanelBody({ title, shareUrl, imageUrl, pricePaise, isMobile, onClose }) {
  const displayTitle = (title ?? "").trim() || "Decoration setup";
  const message = buildProductShareMessage(title, shareUrl);
  const linkLabel = shareUrl.replace(/^https?:\/\//, "");
  const showNative = canUseNativeShare();

  const [copied, setCopied] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  async function onCopy() {
    try {
      await copyProductLink(shareUrl);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      toast.add({ title: "Could not copy link", type: "error" });
    }
  }

  function go(action) {
    action();
    onClose?.();
  }

  async function onMore() {
    try {
      await shareNative({ title, url: shareUrl });
      onClose?.();
    } catch (err) {
      if (err?.name === "AbortError") return;
      toast.add({ title: "Could not share", type: "error" });
    }
  }

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      {/* Product preview */}
      <div className="flex items-center gap-3 rounded-[var(--r-card)] bg-[#d9f0ed] p-3 dark:bg-primary/15">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            className="size-14 shrink-0 rounded-[var(--r-btn)] object-cover"
          />
        ) : (
          <span className="flex size-14 shrink-0 items-center justify-center rounded-[var(--r-btn)] bg-card">
            <Link2Icon className="size-6 text-primary" aria-hidden />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="line-clamp-2 text-sm font-semibold text-foreground">{displayTitle}</p>
          {pricePaise != null ? (
            <p className="text-sm font-semibold tabular-nums text-primary">{formatPaise(pricePaise)}</p>
          ) : null}
        </div>
      </div>

      {/* Link + inline copy */}
      <div className="flex items-center gap-2 rounded-[var(--r-btn)] border border-border bg-card py-1.5 pr-1.5 pl-3.5">
        <Link2Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground" title={shareUrl}>
          {linkLabel}
        </span>
        <button
          type="button"
          onClick={() => void onCopy()}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[var(--r-btn)] px-3.5 text-sm font-semibold text-white transition-colors",
            copied ? "bg-success" : "bg-primary hover:bg-primary/90",
          )}
          aria-live="polite"
        >
          {copied ? (
            <CheckIcon className="size-4" strokeWidth={2.5} aria-hidden />
          ) : (
            <CopyIcon className="size-4" strokeWidth={2.5} aria-hidden />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      {/* App targets */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          Share via
        </p>
        {/* Phones: one scrollable row. Desktop: targets wrap evenly, no hidden scrolling. */}
        <div className="-mx-1 flex min-w-0 gap-1 overflow-x-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:justify-between md:overflow-visible [&::-webkit-scrollbar]:hidden">
          <ShareTarget label="WhatsApp" bg="#25D366" onClick={() => go(() => shareViaWhatsApp(message))}>
            <WhatsAppShareIcon className="size-[26px]" />
          </ShareTarget>
          <ShareTarget
            label="Telegram"
            bg="#229ED9"
            onClick={() => go(() => shareViaTelegram(displayTitle, shareUrl))}
          >
            <SendIcon className="size-[22px]" strokeWidth={2.25} aria-hidden />
          </ShareTarget>
          <ShareTarget label="Facebook" bg="#1877F2" onClick={() => go(() => shareViaFacebook(shareUrl))}>
            <FacebookGlyph className="size-[22px]" />
          </ShareTarget>
          {/* SMS links only work on phones. */}
          {isMobile ? (
            <ShareTarget label="Messages" bg="#34C759" onClick={() => go(() => shareViaSms(message))}>
              <MessageSquareTextIcon className="size-[22px]" strokeWidth={2.25} aria-hidden />
            </ShareTarget>
          ) : null}
          <ShareTarget
            label="Email"
            bg="#EA4335"
            onClick={() => go(() => shareViaEmail(displayTitle, message))}
          >
            <MailIcon className="size-[22px]" strokeWidth={2.25} aria-hidden />
          </ShareTarget>
          {showNative ? (
            <ShareTarget label="More" bg="#E2ECEA" fg="#0F172A" onClick={() => void onMore()}>
              <MoreHorizontalIcon className="size-6" strokeWidth={2.5} aria-hidden />
            </ShareTarget>
          ) : null}
        </div>
      </div>
    </div>
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

/** Phones: bottom sheet. Desktop: centred dialog. Same content in both (app parity). */
export function ProductShareSheet({
  open,
  onOpenChange,
  title,
  productId,
  shareUrl: shareUrlProp,
  imageUrl,
  pricePaise,
}) {
  const isMobile = useIsMobile();
  const shareUrl = useMemo(() => {
    if (shareUrlProp) return shareUrlProp;
    if (!productId) return canonicalUrl("/");
    return canonicalUrl(productPath(productId));
  }, [productId, shareUrlProp]);

  const displayTitle = (title ?? "").trim() || "Decoration setup";

  function close() {
    onOpenChange(false);
  }

  const body = (
    <SharePanelBody
      title={title}
      shareUrl={shareUrl}
      imageUrl={imageUrl}
      pricePaise={pricePaise}
      isMobile={isMobile}
      onClose={close}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange} swipeDirection="down">
        <DrawerContent className="z-[60] max-h-[85dvh] rounded-t-[var(--r-sheet)] border-t pb-[max(1rem,env(safe-area-inset-bottom))] [--drawer-inset:0px]">
          <div className="overflow-y-auto px-5 pt-2 pb-2" data-lenis-prevent>
            <DrawerTitle className="mb-4 text-center font-heading text-lg font-semibold tracking-tight">
              Share
            </DrawerTitle>
            <DrawerDescription className="sr-only">Share {displayTitle}</DrawerDescription>
            {body}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        The dialog is a CSS grid; `grid-cols-1` + `min-w-0` on the body let long content
        (the link) shrink and truncate instead of pushing past the dialog edge.
      */}
      <DialogContent className="z-[60] grid-cols-1 gap-5 overflow-hidden rounded-[var(--r-sheet)] p-6 sm:max-w-md">
        {/* Title centred in the full width; the close button sits on top at the right. */}
        <DialogHeader className="px-10">
          <DialogTitle className="text-center font-heading text-lg font-semibold">Share</DialogTitle>
          <DialogDescription className="sr-only">Share {displayTitle}</DialogDescription>
        </DialogHeader>
        <div className="min-w-0">{body}</div>
      </DialogContent>
    </Dialog>
  );
}
