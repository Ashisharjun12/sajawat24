import { useEffect, useRef, useState } from "react"
import { PaperclipIcon, SendIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ChatMessageBubble } from "@/module/chat/components/ChatMessageBubble"
import { TypingIndicator } from "@/module/chat/components/TypingIndicator"
import { useConversationTyping } from "@/module/chat/hooks/use-conversation-typing"

export function ChatThreadView({
  messages,
  loading,
  error,
  isSending,
  isUploading = false,
  sendMessage,
  sendAttachment,
  conversation,
  ownRole = "customer",
  placeholder = "Type a message...",
  composerDisabled = false,
}) {
  const [draft, setDraft] = useState("")
  const [sendError, setSendError] = useState("")
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)
  const { otherTyping } = useConversationTyping(conversation?.id, draft, ownRole)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, otherTyping])

  async function handleSend() {
    const body = draft.trim()
    if (!body || isSending || isUploading) return
    setSendError("")
    setDraft("")
    try {
      await sendMessage(body)
    } catch (err) {
      setDraft(body)
      setSendError(getApiError(err))
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !sendAttachment) return
    setSendError("")
    try {
      await sendAttachment(file)
    } catch (err) {
      setSendError(getApiError(err))
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const disabled =
    composerDisabled || !conversation || isSending || isUploading || conversation?.status === "closed"

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4" data-lenis-prevent>
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No messages yet.</p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <ChatMessageBubble
                key={message.id}
                message={message}
                isOwn={message.senderRole === ownRole}
                isSystem={message.messageType === "system"}
              />
            ))}
            {otherTyping ? <TypingIndicator align="left" /> : null}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {sendError ? <p className="px-4 pb-1 text-xs text-destructive">{sendError}</p> : null}

      <div className="flex shrink-0 items-center gap-2 border-t border-border px-4 py-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          className="hidden"
          onChange={(event) => void handleFileChange(event)}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={disabled}
          aria-label="Attachments"
          onClick={() => fileInputRef.current?.click()}
        >
          {isUploading ? <Spinner className="size-4" /> : <PaperclipIcon className="size-4" />}
        </Button>
        <Input
          className="flex-1"
          placeholder={placeholder}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              void handleSend()
            }
          }}
          disabled={disabled}
        />
        <Button
          type="button"
          size="icon"
          onClick={() => void handleSend()}
          disabled={disabled || !draft.trim()}
          aria-label="Send"
        >
          <SendIcon className="size-4" />
        </Button>
      </div>
    </>
  )
}
