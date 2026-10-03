import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  InboxIcon,
  MessageCircleIcon,
  MessagesSquareIcon,
  PaperclipIcon,
  SearchIcon,
  SendIcon,
} from "lucide-react"
import {
  assignConversation,
  closeConversation,
  getConversation,
  getUnreadCount,
  listConversations,
  listMessages,
  markRead,
  reopenConversation,
  sendMessage,
} from "@/api/chat.api"
import { getApiError } from "@/api/api"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useChatStore } from "@/store/chat.store"
import { cn } from "@/lib/utils"
import { InboxConversationSkeleton } from "@/module/inbox/components/InboxConversationSkeleton"
import { InboxEmptyState } from "@/module/inbox/components/InboxEmptyState"
import { InboxMessageBubble } from "@/module/inbox/components/InboxMessageBubble"
import { InboxThreadSkeleton } from "@/module/inbox/components/InboxThreadSkeleton"
import { InboxTopicBadge } from "@/module/inbox/components/InboxTopicBadge"
import { PresenceDot } from "@/module/inbox/components/PresenceDot"
import { uploadChatAttachment } from "@/module/inbox/lib/upload-chat-attachment"
import {
  dedupeAppend,
  inboxAssignedLabel,
  inboxEmptyListDescription,
  INBOX_ASSIGNED_OPTIONS,
  INBOX_STATUS_OPTIONS,
  inboxStatusLabel,
  newClientMessageId,
  participantInitials,
  participantLabel,
  patchConversationList,
  patchReadStatus,
  relativeTime,
  slaLabel,
} from "@/module/inbox/lib/inbox-utils"

const MESSAGE_PAGE_SIZE = 50

export function InboxPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const setTotalUnreadCount = useChatStore((s) => s.setTotalUnreadCount)

  const [typeTab, setTypeTab] = useState("customer_support")
  const [status, setStatus] = useState("open")
  const [assigned, setAssigned] = useState("all")
  const [search, setSearch] = useState("")
  const [conversations, setConversations] = useState([])
  const [total, setTotal] = useState(0)
  const [loadingList, setLoadingList] = useState(true)
  const [active, setActive] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingThread, setLoadingThread] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [hasOlder, setHasOlder] = useState(false)
  const [draft, setDraft] = useState("")
  const [isUploading, setIsUploading] = useState(false)
  const [listError, setListError] = useState("")
  const messagesRef = useRef(null)
  const bottomRef = useRef(null)
  const fileInputRef = useRef(null)

  const loadList = useCallback(async () => {
    setLoadingList(true)
    setListError("")
    try {
      const data = await listConversations({
        type: typeTab,
        status: status === "all" ? undefined : status,
        assigned: assigned === "all" ? undefined : assigned,
        q: search || undefined,
        page: 1,
        limit: 50,
      })
      setConversations(data.items ?? [])
      setTotal(data.total ?? 0)
      const unread = await getUnreadCount()
      setTotalUnreadCount(unread.total ?? 0)
    } catch (err) {
      setListError(getApiError(err))
    } finally {
      setLoadingList(false)
    }
  }, [typeTab, status, assigned, search, setTotalUnreadCount])

  const loadThread = useCallback(async (id) => {
    if (!id) {
      setActive(null)
      setMessages([])
      setHasOlder(false)
      return
    }
    setLoadingThread(true)
    try {
      const [conv, msgs] = await Promise.all([
        getConversation(id),
        listMessages(id, { limit: MESSAGE_PAGE_SIZE }),
      ])
      setActive(conv)
      setMessages(msgs ?? [])
      setHasOlder((msgs?.length ?? 0) >= MESSAGE_PAGE_SIZE)
      setActiveConversation(id)
      const last = msgs?.[msgs.length - 1]
      if (last) await markRead(id, last.id)
    } catch (err) {
      setListError(getApiError(err))
    } finally {
      setLoadingThread(false)
    }
  }, [setActiveConversation])

  const loadOlderMessages = useCallback(async () => {
    if (!conversationId || loadingOlder || !hasOlder || messages.length === 0) return
    setLoadingOlder(true)
    try {
      const first = messages[0]
      const older = await listMessages(conversationId, {
        beforeSequence: first.sequence,
        limit: MESSAGE_PAGE_SIZE,
      })
      if (!older?.length) {
        setHasOlder(false)
        return
      }
      setMessages((prev) => {
        const merged = [...older, ...prev]
        const seen = new Set()
        return merged.filter((m) => {
          if (seen.has(m.id)) return false
          seen.add(m.id)
          return true
        })
      })
      if (older.length < MESSAGE_PAGE_SIZE) setHasOlder(false)
    } catch (err) {
      setListError(getApiError(err))
    } finally {
      setLoadingOlder(false)
    }
  }, [conversationId, loadingOlder, hasOlder, messages])

  useEffect(() => {
    void loadList()
  }, [loadList])

  useEffect(() => {
    void loadThread(conversationId)
    return () => setActiveConversation(null)
  }, [conversationId, loadThread, setActiveConversation])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, conversationId])

  useEffect(() => {
    function onChatMessage(event) {
      const payload = event.detail
      if (!payload?.conversationId) return

      setConversations((prev) => patchConversationList(prev, payload, conversationId))

      if (payload.conversationId === conversationId && payload.message) {
        setMessages((prev) => dedupeAppend(prev, payload.message))
        void markRead(conversationId, payload.message.id).catch(() => {})
      }

      void getUnreadCount()
        .then((unread) => setTotalUnreadCount(unread.total ?? 0))
        .catch(() => {})
    }

    function onChatRead(event) {
      const payload = event.detail
      if (payload?.conversationId !== conversationId) return
      setMessages((prev) => patchReadStatus(prev, payload.readUpToSequence))
    }

    window.addEventListener("chat:message", onChatMessage)
    window.addEventListener("chat:read", onChatRead)
    return () => {
      window.removeEventListener("chat:message", onChatMessage)
      window.removeEventListener("chat:read", onChatRead)
    }
  }, [conversationId, setTotalUnreadCount])

  async function handleSend() {
    const body = draft.trim()
    if (!body || !conversationId || isUploading) return
    const clientMessageId = newClientMessageId()
    setDraft("")
    const msg = await sendMessage(conversationId, { body, clientMessageId })
    setMessages((prev) => dedupeAppend(prev, msg))
    setConversations((prev) =>
      patchConversationList(
        prev,
        { conversationId, message: { ...msg, body } },
        conversationId,
      ),
    )
  }

  async function handleSendAttachment(file) {
    const activeConversationId = conversationId
    if (!file || !activeConversationId || isUploading || active?.status === "closed") return
    const clientMessageId = newClientMessageId()
    const body = file.name
    setIsUploading(true)
    try {
      const { uploadId, messageType } = await uploadChatAttachment(activeConversationId, file)
      const msg = await sendMessage(activeConversationId, {
        body: messageType === "file" ? body : "",
        uploadId,
        messageType,
        clientMessageId,
      })
      setMessages((prev) => dedupeAppend(prev, msg))
      setConversations((prev) =>
        patchConversationList(prev, { conversationId: activeConversationId, message: msg }, activeConversationId),
      )
    } finally {
      setIsUploading(false)
    }
  }

  async function handleFileChange(event) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return
    await handleSendAttachment(file)
  }

  async function handleClose() {
    if (!conversationId) return
    await closeConversation(conversationId)
    const conv = await getConversation(conversationId)
    setActive(conv)
    void loadList()
  }

  async function handleReopen() {
    if (!conversationId) return
    await reopenConversation(conversationId)
    const conv = await getConversation(conversationId)
    setActive(conv)
    void loadList()
  }

  async function handleAssignToMe() {
    if (!conversationId) return
    const conv = await assignConversation(conversationId)
    setActive(conv)
    void loadList()
  }

  const activeLabel = active ? participantLabel(active) : ""
  const activeParticipant = active?.participants?.find((p) => p.role !== "admin")
  const isParticipantOnline = activeParticipant?.isOnline ?? false

  return (
    <div className="flex h-full min-h-0 overflow-hidden border border-border bg-background">
      <div className="flex w-full max-w-sm shrink-0 flex-col border-r border-border">
        <div className="space-y-3 border-b border-border p-4">
          <Tabs value={typeTab} onValueChange={setTypeTab}>
            <TabsList className="w-full" variant="line">
              <TabsTrigger value="vendor_support">Partner</TabsTrigger>
              <TabsTrigger value="customer_support">Customer</TabsTrigger>
              <TabsTrigger value="complaint">Complaints</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="grid grid-cols-2 gap-2">
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Status">
                  {inboxStatusLabel(status)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INBOX_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={assigned} onValueChange={setAssigned}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Assignment">
                  {inboxAssignedLabel(assigned)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {INBOX_ASSIGNED_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search chats..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loadingList ? (
            <InboxConversationSkeleton />
          ) : listError ? (
            <p className="p-4 text-sm text-destructive">{listError}</p>
          ) : conversations.length === 0 ? (
            <InboxEmptyState
              className="m-4 border-none p-6"
              icon={MessagesSquareIcon}
              title="No conversations"
              description={inboxEmptyListDescription({ status, assigned })}
            />
          ) : (
            conversations.map((item) => {
              const label = participantLabel(item)
              const sla = slaLabel(item.lastMessageAt, item.type)
              const peer = item.participants?.find((p) => p.role !== "admin")
              const peerOnline = peer?.isOnline ?? false
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(`/inbox/${item.id}`)}
                  className={cn(
                    "flex w-full gap-3 border-b border-border px-4 py-3 text-left hover:bg-muted/50",
                    conversationId === item.id && "bg-muted",
                  )}
                >
                  <Avatar className="size-10 shrink-0">
                    <AvatarFallback className="text-xs">
                      {participantInitials(label)}
                    </AvatarFallback>
                    <PresenceDot online={peerOnline} />
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">{label}</p>
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        {relativeTime(item.lastMessageAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {item.lastMessagePreview || "No messages yet"}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <InboxTopicBadge item={item} />
                      {item.orderRef ? (
                        <Badge variant="outline" className="text-[10px]">
                          {item.orderRef}
                        </Badge>
                      ) : null}
                      {sla ? (
                        <Badge
                          variant={sla.urgent ? "destructive" : "secondary"}
                          className="text-[10px]"
                        >
                          {sla.text}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  {item.unreadCount > 0 ? (
                    <Badge className="shrink-0 self-center">{item.unreadCount}</Badge>
                  ) : null}
                </button>
              )
            })
          )}
        </div>
        <p className="border-t border-border p-2 text-xs text-muted-foreground">{total} total</p>
      </div>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {!conversationId ? (
          <InboxEmptyState
            className="flex-1 border-none"
            icon={InboxIcon}
            title="Your inbox"
            description="Pick a conversation from the list to read and reply."
          />
        ) : loadingThread && messages.length === 0 ? (
          <InboxThreadSkeleton />
        ) : (
          <>
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar className="size-9 shrink-0">
                  <AvatarFallback className="text-xs">
                    {participantInitials(activeLabel)}
                  </AvatarFallback>
                  <PresenceDot online={isParticipantOnline} />
                </Avatar>
                <div className="min-w-0">
                  <p className="truncate font-medium">{activeLabel}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] font-medium",
                        isParticipantOnline ? "text-emerald-600" : "text-muted-foreground",
                      )}
                    >
                      {isParticipantOnline ? "Online" : "Offline"}
                    </span>
                    <Badge variant="outline" className="text-[10px] capitalize">
                      {active?.status}
                    </Badge>
                    <InboxTopicBadge item={active} />
                    {active?.orderRef ? (
                      <span className="text-xs text-muted-foreground">{active.orderRef}</span>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                {!active?.assignedAdminId ? (
                  <Button size="sm" variant="outline" onClick={() => void handleAssignToMe()}>
                    Assign to me
                  </Button>
                ) : null}
                {active?.status === "closed" ? (
                  <Button size="sm" variant="outline" onClick={() => void handleReopen()}>
                    Reopen
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => void handleClose()}>
                    Close
                  </Button>
                )}
              </div>
            </div>

            <div
              ref={messagesRef}
              className="min-h-0 flex-1 overflow-y-auto p-4"
              onScroll={(e) => {
                if (e.currentTarget.scrollTop < 48) void loadOlderMessages()
              }}
            >
              {hasOlder ? (
                <div className="mb-3 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={loadingOlder}
                    onClick={() => void loadOlderMessages()}
                  >
                    {loadingOlder ? "Loading..." : "Load older messages"}
                  </Button>
                </div>
              ) : null}
              <div className="space-y-3">
                {messages.length === 0 ? (
                  <InboxEmptyState
                    className="border-none py-12"
                    icon={MessageCircleIcon}
                    title="No messages yet"
                    description="Send the first reply to start this conversation."
                  />
                ) : null}
                {messages.map((msg) => (
                  <InboxMessageBubble key={msg.id} message={msg} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

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
                disabled={isUploading || active?.status === "closed"}
                aria-label="Attachments"
                onClick={() => fileInputRef.current?.click()}
              >
                {isUploading ? (
                  <Spinner className="size-4" />
                ) : (
                  <PaperclipIcon className="size-4" />
                )}
              </Button>
              <Input
                className="flex-1"
                placeholder="Type a message..."
                value={draft}
                disabled={isUploading || active?.status === "closed"}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    void handleSend()
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                onClick={() => void handleSend()}
                disabled={!draft.trim() || isUploading || active?.status === "closed"}
                aria-label="Send"
              >
                {isUploading ? <Spinner className="size-4" /> : <SendIcon className="size-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
