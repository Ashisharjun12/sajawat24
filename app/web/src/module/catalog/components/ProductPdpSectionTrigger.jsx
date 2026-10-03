import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccordionTrigger } from "@/components/ui/accordion";

export function ProductPdpSectionTrigger({ icon, iconClassName, title, subtitle }) {
  return (
    <AccordionTrigger className="items-center gap-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-full",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col text-left">
          <span className="font-semibold text-foreground">{title}</span>
          {subtitle ? (
            <span className="text-sm font-normal text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
      </span>
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border bg-background text-foreground group-aria-expanded/accordion-trigger:border-transparent group-aria-expanded/accordion-trigger:bg-primary group-aria-expanded/accordion-trigger:text-primary-foreground">
        <ChevronDownIcon className="size-4 group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon className="hidden size-4 group-aria-expanded/accordion-trigger:inline" />
      </span>
    </AccordionTrigger>
  );
}
