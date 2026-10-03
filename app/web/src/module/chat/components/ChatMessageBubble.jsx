import { FileTextIcon } from "lucide-react"
import { MessageReceiptIcon } from "@/module/chat/components/MessageReceiptIcon"
import { formatMessageTime } from "@/module/chat/lib/chat-utils"
import { cn } from "@/lib/utils"

export function ChatMessageBubble({ message, isOwn, isSystem }) {
  const hasAttachment =
    (message.messageType === "image" || message.messageType === "file") && message.attachmentUrl

  return (
    <div className={cn("flex", isSystem ? "justify-center" : isOwn ? "justify-end" : "justify-start")}>
      <div className="max-w-[80%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isSystem && "bg-transparent text-xs text-muted-foreground",
            !isSystem && (isOwn ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"),
          )}
        >
          {hasAttachment && message.messageType === "image" ? (
            <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
              <img
                src={message.attachmentUrl}
                alt={message.body || "Image"}
                className="max-h-56 w-full max-w-[240px] rounded-xl object-cover"
              />
            </a>
          ) : null}

          {hasAttachment && message.messageType === "file" ? (
            <a
              href={message.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "flex items-center gap-2 rounded-xl px-2 py-1.5",
                isOwn ? "text-primary-foreground" : "text-foreground",
              )}
            >
              <FileTextIcon className="size-4 shrink-0" />
              <span className="truncate font-medium">{message.body || "Document"}</span>
            </a>
          ) : null}

          {!hasAttachment && message.body ? <p>{message.body}</p> : null}

          {hasAttachment && message.body && message.messageType !== "text" ? (
            <p className="mt-2 text-xs opacity-80">{message.body}</p>
          ) : null}
        </div>

        {!isSystem ? (
          <div
            className={cn(
              "mt-1 flex items-center gap-1 text-[10px] text-muted-foreground",
              isOwn ? "justify-end" : "justify-start",
            )}
          >
            <span>{formatMessageTime(message.createdAt)}</span>
            {isOwn ? <MessageReceiptIcon status={message.readStatus} /> : null}
          </div>
        ) : null}
      </div>
    </div>
  )
}
