import { cn } from "@/lib/utils";

const STEPS = [
  { id: "checkout", label: "Checkout" },
  { id: "review", label: "Review and pay" },
  { id: "confirmation", label: "Order confirmation" },
];

export function CheckoutProgressHeader({ phase = "checkout", className }) {
  const activeIndex = STEPS.findIndex((step) => step.id === phase);

  return (
    <nav
      aria-label="Checkout progress"
      className={cn("flex flex-wrap items-center gap-x-2 gap-y-1 text-sm", className)}
    >
      {STEPS.map((step, index) => {
        const isActive = index === activeIndex;
        const isPast = index < activeIndex;
        return (
          <span key={step.id} className="inline-flex items-center gap-2">
            {index > 0 ? (
              <span className="text-muted-foreground/50" aria-hidden>
                &gt;
              </span>
            ) : null}
            <span
              className={cn(
                isActive && "font-semibold text-foreground",
                !isActive && isPast && "text-foreground/80",
                !isActive && !isPast && "text-muted-foreground",
              )}
            >
              {index + 1}. {step.label}
            </span>
          </span>
        );
      })}
    </nav>
  );
}
