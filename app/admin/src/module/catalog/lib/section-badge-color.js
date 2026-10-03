export const SECTION_BADGE_COLOR_OPTIONS = [
  { value: "amber", label: "Amber", swatch: "bg-amber-500", hex: "#f59e0b" },
  { value: "emerald", label: "Emerald", swatch: "bg-emerald-600", hex: "#059669" },
  { value: "rose", label: "Rose", swatch: "bg-rose-500", hex: "#f43f5e" },
  { value: "sky", label: "Sky", swatch: "bg-sky-600", hex: "#0284c7" },
  { value: "violet", label: "Violet", swatch: "bg-violet-600", hex: "#7c3aed" },
  { value: "orange", label: "Orange", swatch: "bg-orange-500", hex: "#f97316" },
  { value: "slate", label: "Slate", swatch: "bg-slate-600", hex: "#475569" },
]

const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/

export function isSectionBadgeHex(value) {
  return typeof value === "string" && HEX_COLOR_RE.test(value.trim())
}

export function normalizeSectionBadgeHex(value) {
  const trimmed = String(value ?? "").trim()
  if (!HEX_COLOR_RE.test(trimmed)) return null
  const body = trimmed.slice(1)
  if (body.length === 3) {
    return `#${body.split("").map((c) => c + c).join("").toLowerCase()}`
  }
  return `#${body.toLowerCase()}`
}

export function isSectionBadgePreset(value) {
  return SECTION_BADGE_COLOR_OPTIONS.some((option) => option.value === value)
}

export function isValidSectionBadgeColor(value) {
  return isSectionBadgePreset(value) || isSectionBadgeHex(value)
}

export function presetHex(value) {
  return SECTION_BADGE_COLOR_OPTIONS.find((option) => option.value === value)?.hex ?? "#f59e0b"
}

export function pickerValueFromBadgeColor(value) {
  if (isSectionBadgeHex(value)) {
    return normalizeSectionBadgeHex(value) ?? "#f59e0b"
  }
  return presetHex(value)
}
