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
      className={cn("review-star-row inline-flex gap-0.5", className)}
      role={interactive ? "radiogroup" : undefined}
      aria-label={interactive ? "Rating" : `${rating} out of 5 stars`}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const star = index + 1
        const active = star <= rating
        const starVisual = cn(starClass, active ? "review-star-filled" : "review-star-empty")

        if (interactive) {
          return (
            <button
              key={star}
              type="button"
              disabled={disabled}
              className={cn(
                "rounded-sm p-0.5 transition-opacity disabled:opacity-50",
                !active && "hover:opacity-100 opacity-90",
              )}
              aria-label={`${star} star${star > 1 ? "s" : ""}`}
              onClick={() => onChange?.(star)}
            >
              <StarIcon
                className={starVisual}
                strokeWidth={1.5}
                data-review-star={active ? "filled" : "empty"}
              />
            </button>
          )
        }

        return (
          <StarIcon
            key={star}
            className={starVisual}
            strokeWidth={1.5}
            data-review-star={active ? "filled" : "empty"}
            aria-hidden
          />
        )
      })}
    </div>
  )
}
