import { useRef } from "react"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  isSectionBadgeHex,
  isSectionBadgePreset,
  normalizeSectionBadgeHex,
  pickerValueFromBadgeColor,
  SECTION_BADGE_COLOR_OPTIONS,
} from "@/module/catalog/lib/section-badge-color"

export function SectionBadgeColorField({ value, onChange, invalid, error }) {
  const colorInputRef = useRef(null)
  const displayHex = pickerValueFromBadgeColor(value)
  const isCustom = isSectionBadgeHex(value) && !isSectionBadgePreset(value)

  function applyHex(next) {
    const normalized = normalizeSectionBadgeHex(next)
    if (normalized) {
      onChange(normalized)
    }
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel className="text-sm font-semibold">Accent color</FieldLabel>
      <p className="mb-2.5 text-xs text-muted-foreground">
        Product badge in this section uses the section name.
      </p>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-full border bg-transparent p-0.5 transition-colors",
            isCustom || !isSectionBadgePreset(value)
              ? "border-muted-foreground/55"
              : "border-muted-foreground/35",
          )}
          aria-label="Open color picker"
          onClick={() => colorInputRef.current?.showPicker?.() ?? colorInputRef.current?.click()}
        >
          <span
            className="size-[18px] rounded-[3px]"
            style={{ backgroundColor: displayHex }}
          />
          <input
            ref={colorInputRef}
            type="color"
            className="sr-only"
            value={displayHex}
            onChange={(event) => onChange(event.target.value.toLowerCase())}
          />
        </button>

        <Input
          value={displayHex}
          aria-label="Hex color"
          className="h-7 w-[4.75rem] shrink-0 border-0 bg-transparent px-0 font-mono text-xs text-muted-foreground shadow-none focus-visible:ring-0"
          onChange={(event) => {
            const raw = event.target.value.trim()
            if (!raw) return
            applyHex(raw.startsWith("#") ? raw : `#${raw}`)
          }}
          onBlur={() => {
            if (isSectionBadgeHex(value)) {
              const normalized = normalizeSectionBadgeHex(value)
              if (normalized) onChange(normalized)
            }
          }}
        />

        <div
          className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {SECTION_BADGE_COLOR_OPTIONS.map((option) => {
            const selected = value === option.value
            return (
              <button
                key={option.value}
                type="button"
                title={option.label}
                aria-label={option.label}
                aria-pressed={selected}
                onClick={() => onChange(option.value)}
                className={cn(
                  "size-[22px] shrink-0 rounded-full",
                  selected &&
                    "ring-1 ring-muted-foreground/70 ring-offset-1 ring-offset-background",
                )}
                style={{ backgroundColor: option.hex }}
              />
            )
          })}
        </div>
      </div>

      {invalid ? <FieldError errors={[error]} /> : null}
    </Field>
  )
}
