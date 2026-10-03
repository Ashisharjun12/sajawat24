import { Link } from "react-router-dom"
import { ArrowLeftIcon } from "lucide-react"

export function AccountChatPanel({ backTo, title, subtitle, peerOnline, children }) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3">
        <Link
          to={backTo}
          className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Go back"
        >
          <ArrowLeftIcon className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">
            {title}
            {peerOnline ? <span className="font-normal text-muted-foreground"> (online)</span> : null}
          </p>
          {!peerOnline && subtitle ? (
            <p className="truncate text-xs text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
      </header>
      <div className="flex min-h-0 flex-1 flex-col">{children}</div>
    </div>
  )
}
