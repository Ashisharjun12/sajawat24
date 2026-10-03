import { GiftIcon } from "lucide-react";

export function ProductPdpAboutPackage({ description }) {
  const text = (description ?? "").trim();
  if (!text) return null;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm"
      aria-labelledby="pdp-about-title"
    >
      <div className="flex items-start gap-3 bg-sky-50 px-4 py-3.5 dark:bg-sky-950/25">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-600 ring-1 ring-sky-200/80 dark:bg-sky-900/50 dark:text-sky-400 dark:ring-sky-700/50"
          aria-hidden
        >
          <GiftIcon className="size-5" strokeWidth={2} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h2
            id="pdp-about-title"
            className="font-heading text-base font-semibold tracking-tight text-foreground"
          >
            About this package
          </h2>
          <p className="text-sm text-muted-foreground">Décor, styling &amp; finishing touches</p>
        </div>
      </div>
      <div className="px-4 py-4">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </section>
  );
}
