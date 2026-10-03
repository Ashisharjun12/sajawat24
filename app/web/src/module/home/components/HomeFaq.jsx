import { PlusIcon } from "lucide-react";
import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
} from "@/components/ui/accordion";
import { Reveal } from "@/module/home/components/Reveal";
import { useHomeCms } from "@/module/cms/hooks/use-home-cms";
import { DEMO_FAQ } from "@/module/home/data/demo-faq";

export function HomeFaq() {
  const { faqs } = useHomeCms();
  const items = faqs.length > 0 ? faqs : DEMO_FAQ;

  return (
    <Reveal className="mx-auto max-w-[1240px] px-4 py-16 md:px-8">
      <div className="mx-auto w-full max-w-xl">
        <div className="mb-8 text-center">
          <span className="mb-0.5 block text-[15px] font-bold tracking-wide text-amber-800 italic uppercase dark:text-primary">
            before you book
          </span>
          <h2 className="font-heading text-[clamp(1.625rem,3vw,2.25rem)] font-extrabold tracking-tight">
            Frequently asked questions
          </h2>
        </div>
        <Accordion
          className="rounded-none border-none **:data-[slot=accordion-content]:px-0"
          multiple={false}
        >
          {items.map((item) => (
            <AccordionItem
              className="border-border data-open:bg-transparent! not-last:border-b"
              key={item.id}
              value={item.id}
            >
              <AccordionPrimitive.Header className="flex">
                <AccordionPrimitive.Trigger className="flex flex-1 items-center justify-between gap-4 rounded-md py-4 text-left text-[15px] leading-6 font-semibold transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&>svg>path:last-child]:origin-center [&>svg>path:last-child]:transition-all [&>svg>path:last-child]:duration-200 aria-expanded:[&>svg]:rotate-180 aria-expanded:[&>svg>path:last-child]:rotate-90 aria-expanded:[&>svg>path:last-child]:opacity-0">
                  {item.question}
                  <PlusIcon
                    aria-hidden="true"
                    className="pointer-events-none ml-auto size-4 shrink-0 opacity-60 transition-transform duration-200"
                  />
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <AccordionContent className="pb-4 text-muted-foreground">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </Reveal>
  );
}
