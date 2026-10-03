import { useState } from "react";
import { cn } from "@/lib/utils";
import { ProductPdpDetailPanel } from "@/module/catalog/components/ProductPdpDetailPanel";

const TAB_SCROLL =
  "flex min-w-0 gap-0 overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

const TABS = [
  { id: "includes", label: "What's included" },
  { id: "faqs", label: "FAQs" },
  { id: "delivery", label: "Delivery" },
  { id: "care", label: "Care" },
];

function filledPoints(items) {
  return (items ?? []).map((item) => String(item).trim()).filter(Boolean);
}

function filledFaqs(items) {
  return (items ?? []).filter(
    (item) => (item.question ?? "").trim() && (item.answer ?? "").trim(),
  );
}

export function ProductPdpDetailsTabs({
  includes,
  faqs,
  deliverySetup,
  careInstructions,
}) {
  const [activeTab, setActiveTab] = useState("includes");

  const includePoints = filledPoints(includes);
  const faqItems = filledFaqs(faqs);
  const deliveryPoints = filledPoints(deliverySetup);
  const carePoints = filledPoints(careInstructions);

  return (
    <div className="rounded-4xl border bg-card px-4 pb-4 pt-2">
      <div className="border-b border-border">
        <div className={TAB_SCROLL} role="tablist" aria-label="Product details">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "shrink-0 border-b-2 px-3 pb-3 pt-1 text-sm font-semibold transition-colors",
                  isActive
                    ? "-mb-px border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-3">
        <ProductPdpDetailPanel
          tab={activeTab}
          includePoints={includePoints}
          faqItems={faqItems}
          deliveryPoints={deliveryPoints}
          carePoints={carePoints}
        />
      </div>
    </div>
  );
}
