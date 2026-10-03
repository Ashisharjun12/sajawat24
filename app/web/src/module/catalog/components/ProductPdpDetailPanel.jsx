import { CheckIcon, CircleHelpIcon, SparklesIcon, TruckIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

function PanelHeader({ title, count, countLabel }) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <h3 className="font-heading text-base font-semibold text-foreground">{title}</h3>
      {count > 0 && countLabel ? (
        <span className="inline-flex shrink-0 rounded-[var(--r-chip)] bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
          {countLabel}
        </span>
      ) : null}
    </div>
  );
}

function nonEmptyLines(items) {
  return items.map((line) => String(line).trim()).filter(Boolean);
}

function validFaqs(items) {
  return items.filter((item) => item.question?.trim() && item.answer?.trim());
}

function IncludedList({ items }) {
  const lines = nonEmptyLines(items);
  if (!lines.length) {
    return <p className="text-sm text-muted-foreground">No details available.</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {lines.map((point, index) => (
        <li key={`${index}-${point}`} className="flex gap-2.5">
          <span
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"
            aria-hidden
          >
            <CheckIcon className="size-3.5" strokeWidth={3} />
          </span>
          <span className="text-sm leading-snug text-foreground">{point}</span>
        </li>
      ))}
    </ul>
  );
}

function IconBulletList({ items, emptyLabel, lineIcon: LineIcon, iconClassName }) {
  const lines = nonEmptyLines(items);
  if (!lines.length) {
    return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  }
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {lines.map((point, index) => (
        <li key={`${index}-${point}`} className="flex gap-2.5">
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              iconClassName,
            )}
            aria-hidden
          >
            <LineIcon className="size-3" />
          </span>
          <span className="text-sm leading-snug text-foreground">{point}</span>
        </li>
      ))}
    </ul>
  );
}

function FaqList({ items }) {
  const faqs = validFaqs(items);
  if (!faqs.length) {
    return <p className="text-sm text-muted-foreground">No FAQs available.</p>;
  }
  return (
    <Accordion multiple className="rounded-none border-none">
      {faqs.map((item, index) => (
        <AccordionItem
          key={item.key || `${index}-${item.question}`}
          value={item.key || String(index)}
          className="mb-2 rounded-[var(--r-card)] border-none bg-muted/80 last:mb-0 data-open:bg-muted"
        >
          <AccordionTrigger className="gap-2 text-foreground hover:no-underline">
            <CircleHelpIcon
              className="size-4 shrink-0 text-violet-600 dark:text-violet-400"
              aria-hidden
            />
            <span className="min-w-0 flex-1 text-left">{item.question.trim()}</span>
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            <p className="whitespace-pre-wrap pl-6 text-sm">{item.answer.trim()}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function countLabelFor(tab, count) {
  if (count <= 0) return null;
  if (tab === "includes") return `${count} item${count === 1 ? "" : "s"}`;
  if (tab === "faqs") return `${count} FAQ${count === 1 ? "" : "s"}`;
  if (tab === "delivery") return `${count} note${count === 1 ? "" : "s"}`;
  return `${count} tip${count === 1 ? "" : "s"}`;
}

export function ProductPdpDetailPanel({
  tab,
  tabMeta,
  itemCount = 0,
  includePoints,
  faqItems,
  deliveryPoints,
  carePoints,
}) {
  const title = tabMeta?.panelTitle ?? "Details";
  const countLabel = countLabelFor(tab, itemCount);

  return (
    <>
      <PanelHeader title={title} count={itemCount} countLabel={countLabel} />
      {tab === "includes" ? <IncludedList items={includePoints} /> : null}
      {tab === "faqs" ? <FaqList items={faqItems} /> : null}
      {tab === "delivery" ? (
        <IconBulletList
          items={deliveryPoints}
          emptyLabel="No delivery details yet."
          lineIcon={TruckIcon}
          iconClassName="bg-sky-600/15 text-sky-700 dark:text-sky-400"
        />
      ) : null}
      {tab === "care" ? (
        <IconBulletList
          items={carePoints}
          emptyLabel="No care instructions yet."
          lineIcon={SparklesIcon}
          iconClassName="bg-amber-600/15 text-amber-800 dark:text-amber-300"
        />
      ) : null}
    </>
  );
}
