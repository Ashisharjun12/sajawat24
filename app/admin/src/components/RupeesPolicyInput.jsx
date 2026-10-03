import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { parseNonNegativePaise, rupeesInputValue } from "@/lib/money"

export function RupeesPolicyInput({
  id,
  label,
  hint,
  valuePaise,
  onChangePaise,
  min = 0,
  step = 1,
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative max-w-xs">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          ₹
        </span>
        <Input
          id={id}
          type="number"
          min={min}
          step={step}
          className="pl-8"
          value={rupeesInputValue(valuePaise)}
          onChange={(event) => {
            const paise = parseNonNegativePaise(event.target.value)
            if (paise != null) onChangePaise(paise)
          }}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}
