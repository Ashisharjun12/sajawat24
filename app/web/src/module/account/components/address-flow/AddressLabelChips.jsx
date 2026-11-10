import { BriefcaseIcon, HomeIcon, MapPinIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const OPTIONS = [
  { value: "home", label: "Home", Icon: HomeIcon },
  { value: "office", label: "Office", Icon: BriefcaseIcon },
  { value: "other", label: "Other", Icon: MapPinIcon },
];

/** Saved label for a chip. "Other" uses whatever the user typed. */
export function resolveAddressLabel(choice, custom) {
  if (choice === "home") return "Home";
  if (choice === "office") return "Office";
  return (custom ?? "").trim();
}

/** Existing label -> chip. Only exact Home / Office map to a chip; anything else stays as typed text. */
export function choiceFromLabel(label) {
  const text = (label ?? "").trim();
  if (!text || /^home$/i.test(text)) return { choice: "home", custom: "" };
  if (/^office$/i.test(text)) return { choice: "office", custom: "" };
  return { choice: "other", custom: text };
}

/** Home / Office / Other selector. Choosing "Other" is the cue for the parent to show a text field. */
export function AddressLabelChips({ value, onChange, disabled = false }) {
  return (
    <div role="radiogroup" aria-label="Address label" className="flex flex-wrap gap-2.5">
      {OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const selected = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={cn(
              "inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-[var(--r-btn)] border px-4 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "border-primary bg-primary/10 font-semibold text-primary"
                : "border-border bg-background text-foreground hover:bg-muted/50",
            )}
          >
            <Icon className={cn("size-[18px]", selected ? "text-primary" : "text-muted-foreground")} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
