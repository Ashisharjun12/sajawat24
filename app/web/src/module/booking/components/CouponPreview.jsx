import {
  ClockIcon,
  CreditCardIcon,
  MapPinIcon,
  ShoppingBagIcon,
  TicketPercentIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"

const ICONS = {
  bag: ShoppingBagIcon,
  clock: ClockIcon,
  pin: MapPinIcon,
  card: CreditCardIcon,
}

export function CouponPreview({
  label,
  discount,
  badge,
  badgeTone = "success",
  subtitle,
  description,
  conditions = [],
  code,
  className,
  showCopy = true,
}) {
  async function handleCopy() {
    if (!code) return
    try {
      await navigator.clipboard.writeText(code)
      toast.add({ title: "Code copied", description: code, type: "success" })
    } catch {
      toast.add({ title: "Could not copy code", type: "error" })
    }
  }

  if (!discount && !code) return null

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
    >
      <div className="space-y-2 py-4 pr-6 pl-9 sm:pr-7 sm:pl-10">
        {label ? (
          <p className="text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
            {label}
          </p>
        ) : null}

        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="text-xl leading-none font-semibold tracking-tight">{discount}</h3>
          {badge ? (
            <Badge
              variant={badgeTone === "muted" ? "secondary" : "default"}
              className={cn(
                "h-5 px-2 text-[10px]",
                badgeTone !== "muted" &&
                  "border-transparent bg-emerald-600 text-white hover:bg-emerald-600",
              )}
            >
              {badge}
            </Badge>
          ) : null}
          {subtitle ? (
            <span className="text-xs text-muted-foreground">· {subtitle}</span>
          ) : null}
        </div>

        {conditions.length > 0 ? (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            {conditions.map((item, index) => {
              const Icon = ICONS[item.icon] ?? ShoppingBagIcon
              return (
                <span key={`${item.icon}-${item.label}`} className="inline-flex items-center gap-1">
                  {index > 0 ? <span className="text-border">·</span> : null}
                  <Icon
                    className="size-2.5 shrink-0 text-foreground/55 dark:text-white/55"
                    strokeWidth={2}
                  />
                  <span>{item.label}</span>
                </span>
              )
            })}
          </div>
        ) : null}
      </div>

      {code ? (
        <div className="flex items-center justify-between gap-3 border-t border-border/80 bg-muted/50 py-2.5 pr-6 pl-9 sm:pr-7 sm:pl-10">
          <span className="min-w-0 truncate font-mono text-sm font-semibold tracking-[0.06em] uppercase">
            {code}
          </span>
          {showCopy ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className={cn(
                "h-7 shrink-0 gap-1 rounded-full bg-background px-3 text-[11px] font-medium text-foreground shadow-sm",
                "hover:bg-muted",
                "dark:border-border dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 dark:[&_svg]:text-zinc-900",
              )}
              onClick={handleCopy}
            >
              <TicketPercentIcon className="size-3" strokeWidth={2.25} />
              Copy
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
