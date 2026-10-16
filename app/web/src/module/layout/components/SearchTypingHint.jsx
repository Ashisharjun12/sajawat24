import { cn } from "@/lib/utils";
import { useSearchTypingHint } from "@/module/layout/hooks/use-search-typing-hint";

export function SearchTypingHint({ className, active = true }) {
  const suffix = useSearchTypingHint(active);

  return (
    <span className={cn("inline-flex min-w-0 items-baseline truncate", className)}>
      <span className="shrink-0">Search&nbsp;</span>
      <span className="min-w-0 truncate text-muted-foreground/90">{suffix}</span>
      <span
        className="ml-px inline-block w-[2px] shrink-0 animate-pulse text-muted-foreground/70"
        aria-hidden
      >
        |
      </span>
    </span>
  );
}
