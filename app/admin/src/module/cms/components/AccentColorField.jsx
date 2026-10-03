import { Label } from "@/components/ui/label"

const DEFAULT_HEX = "#7c5c12"

const PRESETS = [
  "#7c5c12",
  "#b45309",
  "#be123c",
  "#7c3aed",
  "#0369a1",
  "#047857",
  "#334155",
]

function normalizeHex(value) {
  if (!value) return DEFAULT_HEX
  const hex = value.startsWith("#") ? value : `#${value}`
  return /^#[0-9a-fA-F]{6}$/.test(hex) ? hex.toLowerCase() : DEFAULT_HEX
}

export function AccentColorField({ value, onChange, id = "accent-color" }) {
  const hex = normalizeHex(value)

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>Accent color</Label>
      <div className="flex flex-wrap items-center gap-2">
        <input
          id={id}
          type="color"
          value={hex}
          aria-label="Pick accent color"
          onChange={(event) => onChange(event.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        />
        <span className="min-w-16 font-mono text-sm text-muted-foreground">{hex}</span>
        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-label={`Use ${preset}`}
              onClick={() => onChange(preset)}
              className="size-6 rounded-md border border-border ring-offset-background transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              style={{ backgroundColor: preset }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
