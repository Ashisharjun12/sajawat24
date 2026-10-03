import { useState } from "react";
import {
  CheckIcon,
  CircleHelpIcon,
  PackageIcon,
  SparklesIcon,
  TruckIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductPdpDetailPanel } from "@/module/catalog/components/ProductPdpDetailPanel";

const TAB_SCROLL =
  "flex min-w-0 gap-2 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const PDP_DETAIL_TABS = [
  {
    id: "includes",
    label: "Included",
    panelTitle: "Included in your setup",
    icon: PackageIcon,
    chipIdle:
      "bg-emerald-600/10 text-emerald-800 hover:bg-emerald-600/15 dark:text-emerald-300",
    chipActive: "bg-primary text-primary-foreground shadow-sm",
  },
  {
    id: "faqs",
    label: "FAQs",
    panelTitle: "Common questions",
    icon: CircleHelpIcon,
    chipIdle:
      "bg-violet-500/10 text-violet-800 hover:bg-violet-500/15 dark:text-violet-300",
    chipActive: "bg-violet-600 text-white shadow-sm",
  },
  {
    id: "delivery",
    label: "Delivery",
    panelTitle: "Delivery & setup",
    icon: TruckIcon,
    chipIdle: "bg-sky-500/10 text-sky-800 hover:bg-sky-500/15 dark:text-sky-300",
    chipActive: "bg-sky-600 text-white shadow-sm",
  },
  {
    id: "care",
    label: "Care",
    panelTitle: "Care instructions",
    icon: SparklesIcon,
    chipIdle:
      "bg-amber-500/10 text-amber-900 hover:bg-amber-500/15 dark:text-amber-200",
    chipActive: "bg-amber-700 text-white shadow-sm dark:bg-amber-600",
  },
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

  const activeMeta = PDP_DETAIL_TABS.find((tab) => tab.id === activeTab) ?? PDP_DETAIL_TABS[0];

  const itemCounts = {
    includes: includePoints.length,
    faqs: faqItems.length,
    delivery: deliveryPoints.length,
    care: carePoints.length,
  };

  return (
    <section
      className="rounded-[var(--r-card)] border border-border/80 bg-card px-4 py-4 shadow-sm"
      aria-labelledby="pdp-package-details-title"
    >
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
          aria-hidden
        >
          <PackageIcon className="size-4" />
        </span>
        <h2
          id="pdp-package-details-title"
          className="font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          Package details
        </h2>
      </div>

      <div className={cn(TAB_SCROLL, "mt-4")} role="tablist" aria-label="Package details">
        {PDP_DETAIL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 rounded-[var(--r-btn)] px-3 py-2 text-sm font-semibold transition-colors",
                isActive ? tab.chipActive : tab.chipIdle,
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-border/60 pt-4" role="tabpanel">
        <ProductPdpDetailPanel
          tab={activeTab}
          tabMeta={activeMeta}
          itemCount={itemCounts[activeTab] ?? 0}
          includePoints={includePoints}
          faqItems={faqItems}
          deliveryPoints={deliveryPoints}
          carePoints={carePoints}
        />
      </div>
    </section>
  );
}
