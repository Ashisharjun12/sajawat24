import { StarIcon } from "lucide-react"
import { cn } from "@/lib/utils"

const SIZE_CLASS = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-5",
}

export function ReviewStarRow({
  rating = 0,
  interactive = false,
  onChange,
  size = "sm",
  className,
  disabled = false,
}) {
  const starClass = SIZE_CLASS[size] ?? SIZE_CLASS.sm

  return (
    <div
      className={cn("inline-flex gap-0.5", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : `${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1
        const active = star <= rating

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              className={cn(
                "rounded-sm p-0.5 transition-colors disabled:opacity-50",
                active ? "text-amber-500" : "text-muted-foreground/30 hover:text-amber-500",
              )}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onClick={() => onChange?.(star)}
            >
              <StarIcon className={cn(starClass, active && "fill-current")} />
            </button>
          )
        }

        return (
          <StarIcon
            key={star}
            className={cn(
              starClass,
              active ? "fill-amber-500 text-amber-500" : "text-muted-foreground/30",
            )}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
