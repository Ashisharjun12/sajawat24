import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { formatPaise } from "@/lib/money";

function paiseToRupees(paise) {
  return Math.round(Number(paise) / 100);
}

export function CatalogPriceFilter({
  facetMaxPaise = 0,
  appliedMinRupees,
  appliedMaxRupees,
  onApply,
  disabled = false,
}) {
  const bounds = useMemo(() => {
    const maxR = Math.max(1, paiseToRupees(facetMaxPaise));
    return { min: 0, max: maxR };
  }, [facetMaxPaise]);

  const appliedMin = appliedMinRupees ?? bounds.min;
  const appliedMax = appliedMaxRupees ?? bounds.max;

  const [draft, setDraft] = useState([appliedMin, appliedMax]);

  useEffect(() => {
    setDraft([appliedMin, appliedMax]);
  }, [appliedMin, appliedMax, bounds.min, bounds.max]);

  const dirty = draft[0] !== appliedMin || draft[1] !== appliedMax;

  const rangeReady = facetMaxPaise > 0;

  if (!rangeReady) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 sm:flex-row sm:items-center sm:gap-6">
      <p className="shrink-0 text-sm font-semibold text-foreground">Price</p>
      <div className="min-w-0 flex-1 space-y-2">
        <Slider
          min={bounds.min}
          max={bounds.max}
          step={1}
          value={draft}
          onValueChange={(next) => {
            const values = Array.isArray(next) ? next : [next];
            const low = Math.min(values[0] ?? bounds.min, values[1] ?? bounds.max);
            const high = Math.max(values[0] ?? bounds.min, values[1] ?? bounds.max);
            setDraft([low, high]);
          }}
          disabled={disabled}
          className="w-full"
        />
        <div className="flex justify-between text-xs font-medium tabular-nums text-muted-foreground">
          <span>{formatPaise(draft[0] * 100)}</span>
          <span>{formatPaise(draft[1] * 100)}</span>
        </div>
      </div>
      <Button
        type="button"
        size="sm"
        className="shrink-0 rounded-full sm:w-auto"
        disabled={disabled || !dirty}
        onClick={() => {
          const [low, high] = draft;
          const isFullRange = low <= bounds.min && high >= bounds.max;
          onApply?.(
            isFullRange
              ? { minRupees: null, maxRupees: null }
              : {
                  minRupees: low > 0 ? low : null,
                  maxRupees: high < bounds.max ? high : null,
                },
          );
        }}
      >
        Apply
      </Button>
    </div>
  );
}
