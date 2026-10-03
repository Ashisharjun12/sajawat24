import { BadgeCheckIcon, ClockIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

const TRUST_ITEMS = [
  {
    icon: SparklesIcon,
    title: "10L+ celebrations",
    subtitle: "Loved by customers India-wide",
    tileClass: "bg-amber-100 text-amber-600 dark:bg-amber-950/45 dark:text-amber-400",
  },
  {
    icon: BadgeCheckIcon,
    title: "Verified decorators",
    subtitle: "Trained & background-checked",
    tileClass: "bg-violet-100 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400",
  },
  {
    icon: ClockIcon,
    title: "On-time, guaranteed",
    subtitle: "Setup within your time slot",
    tileClass: "bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:text-sky-400",
  },
  {
    icon: ShieldCheckIcon,
    title: "100% secure payments",
    subtitle: "Easy refunds, no hidden charges",
    tileClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
  },
];

export function FooterTrustBar() {
  return (
    <div className="border-b border-border bg-muted/30">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4 md:px-8">
        {TRUST_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="flex items-start gap-3.5">
              <span
                className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${item.tileClass}`}
              >
                <Icon className="size-5" strokeWidth={2.25} aria-hidden="true" />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="text-sm font-bold tracking-tight text-foreground">{item.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
