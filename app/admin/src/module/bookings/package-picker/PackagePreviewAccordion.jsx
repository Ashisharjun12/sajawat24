import {
  CheckIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CircleHelpIcon,
  PackageIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { filledFaqs, filledPoints } from "@/module/bookings/package-picker/package-picker.utils"

function IncludedList({ items }) {
  const points = filledPoints(items)
  if (!points.length) {
    return <p className="text-sm text-muted-foreground">None listed</p>
  }
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {points.map((point, index) => (
        <li key={`${index}-${point}`} className="flex gap-2 text-sm">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/15 text-emerald-600 dark:text-emerald-400">
            <CheckIcon className="size-3.5" />
          </span>
          <span>{point}</span>
        </li>
      ))}
    </ul>
  )
}

function BulletList({ items }) {
  const points = filledPoints(items)
  if (!points.length) {
    return <p className="text-sm text-muted-foreground">None listed</p>
  }
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      {points.map((point, index) => (
        <li key={`${index}-${point}`}>{point}</li>
      ))}
    </ul>
  )
}

function SectionTrigger({ icon, iconClassName, title, subtitle }) {
  return (
    <AccordionTrigger className="items-center gap-3 py-3 hover:no-underline **:data-[slot=accordion-trigger-icon]:hidden">
      <span className="flex min-w-0 flex-1 items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-full",
            iconClassName,
          )}
        >
          {icon}
        </span>
        <span className="flex min-w-0 flex-col text-left">
          <span className="text-sm font-medium">{title}</span>
          {subtitle ? (
            <span className="text-xs font-normal text-muted-foreground">{subtitle}</span>
          ) : null}
        </span>
      </span>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-full border bg-background text-foreground group-aria-expanded/accordion-trigger:border-transparent group-aria-expanded/accordion-trigger:bg-primary group-aria-expanded/accordion-trigger:text-primary-foreground">
        <ChevronDownIcon className="size-3.5 group-aria-expanded/accordion-trigger:hidden" />
        <ChevronUpIcon className="hidden size-3.5 group-aria-expanded/accordion-trigger:inline" />
      </span>
    </AccordionTrigger>
  )
}

export function PackagePreviewAccordion({ product }) {
  const faqItems = filledFaqs(product?.faqs)
  const includePoints = filledPoints(product?.includes)

  return (
    <Accordion multiple defaultValue={includePoints.length ? ["includes"] : []} className="rounded-2xl border bg-card">
      <AccordionItem value="includes" className="border-b px-3 data-open:bg-transparent">
        <SectionTrigger
          icon={<PackageIcon className="size-4" />}
          iconClassName="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          title="What's included"
          subtitle={includePoints.length ? `${includePoints.length} items` : "Details"}
        />
        <AccordionContent className="pb-3">
          <IncludedList items={product?.includes} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="delivery" className="border-b px-3 data-open:bg-transparent">
        <SectionTrigger
          icon={<TruckIcon className="size-4" />}
          iconClassName="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          title="Delivery & setup"
        />
        <AccordionContent className="pb-3">
          <BulletList items={product?.deliverySetup} />
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="care" className="border-b px-3 data-open:bg-transparent">
        <SectionTrigger
          icon={<SparklesIcon className="size-4" />}
          iconClassName="bg-violet-500/10 text-violet-600 dark:text-violet-400"
          title="Care instructions"
        />
        <AccordionContent className="pb-3">
          <BulletList items={product?.careInstructions} />
        </AccordionContent>
      </AccordionItem>

      {faqItems.length > 0 ? (
        <AccordionItem value="faqs" className="px-3 data-open:bg-transparent">
          <SectionTrigger
            icon={<CircleHelpIcon className="size-4" />}
            iconClassName="bg-muted text-muted-foreground"
            title="FAQs"
            subtitle={`${faqItems.length} questions`}
          />
          <AccordionContent className="pb-3">
            <div className="space-y-3">
              {faqItems.map((item, index) => (
                <div key={`${index}-${item.question}`} className="text-sm">
                  <p className="font-medium">{item.question}</p>
                  <p className="mt-1 text-muted-foreground">{item.answer}</p>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ) : null}
    </Accordion>
  )
}
