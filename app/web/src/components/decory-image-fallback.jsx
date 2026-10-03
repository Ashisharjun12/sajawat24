import { cn } from "@/lib/utils";

export function DecoryImageFallback({ className }) {
  return (
    <span
      className={cn(
        "flex size-full items-center justify-center bg-muted text-muted-foreground",
        className,
      )}
      role="img"
      aria-label="No image"
    >
      <svg
        viewBox="0 0 80 24"
        className="h-[45%] w-[82%]"
        fill="currentColor"
        aria-hidden
      >
        <text
          x="40"
          y="18"
          textAnchor="middle"
          fontSize="16"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight="600"
          letterSpacing="-0.06em"
        >
          Decoryy
        </text>
      </svg>
    </span>
  );
}
