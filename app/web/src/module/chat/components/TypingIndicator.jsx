export function TypingIndicator({ align = "left" }) {
  return (
    <div className={`flex ${align === "right" ? "justify-end" : "justify-start"}`}>
      <div className="flex items-center gap-1.5 rounded-2xl bg-muted px-2.5 py-1.5">
        <span className="flex items-center gap-0.5" aria-hidden>
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:0ms]" />
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:120ms]" />
          <span className="size-1 animate-bounce rounded-full bg-muted-foreground [animation-delay:240ms]" />
        </span>
        <span className="text-[10px] text-muted-foreground">typing…</span>
      </div>
    </div>
  )
}
