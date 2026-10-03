import { formatDistanceToNow } from "date-fns"
import { getHelpTopic } from "@/module/inbox/lib/help-topics"

export function newClientMessageId() {
  return crypto.randomUUID()
}

export function dedupeAppend(messages, message) {
  if (!message) return messages
  const exists = messages.some(
    (m) =>
      m.id === message.id ||
      (message.clientMessageId && m.clientMessageId === message.clientMessageId),
  )
  if (exists) return messages
  return [...messages, message].sort((a, b) => a.sequence - b.sequence)
}

export function participantLabel(item) {
  const names = item.participants
    ?.filter((p) => p.role !== "admin")
    .map((p) => p.name)
    .filter(Boolean)
  if (names?.length) return names.join(", ")
  if (item.type === "customer_support") return "Customer"
  if (item.type === "vendor_support") return "Partner"
  if (item.type === "complaint") return "Customer"
  return "Conversation"
}

export function conversationAboutLabel(item) {
  if (!item) return null

  if (item.type === "customer_support") {
    const topic = getHelpTopic(item.topicKey)
    if (topic) return topic.title
    const subject = item.subject?.trim()
    if (subject && !subject.toLowerCase().startsWith("support chat opened")) return subject
    return "Help & support"
  }

  if (item.type === "vendor_support") return "Partner support"
  if (item.type === "complaint") return item.subject?.trim() || "Complaint"
  return item.subject?.trim() || null
}

export function conversationTopicBadge(item) {
  const label = conversationAboutLabel(item)
  if (!label) return null

  if (item.type === "customer_support") {
    const topic = getHelpTopic(item.topicKey)
    return {
      label,
      className: topic?.badgeClass ?? "bg-slate-600 text-white hover:bg-slate-600",
    }
  }

  if (item.type === "vendor_support") {
    return {
      label,
      className: "bg-indigo-600 text-white hover:bg-indigo-600",
    }
  }

  if (item.type === "complaint") {
    return {
      label,
      className: "bg-rose-600 text-white hover:bg-rose-600",
    }
  }

  return {
    label,
    className: "bg-slate-600 text-white hover:bg-slate-600",
  }
}

export function participantInitials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (!parts.length) return "?"
  return parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("")
}

export function relativeTime(iso) {
  if (!iso) return ""
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true })
  } catch {
    return ""
  }
}

export function slaLabel(lastMessageAt, type) {
  if (!lastMessageAt) return null
  const hours = (Date.now() - new Date(lastMessageAt).getTime()) / (1000 * 60 * 60)
  if (type === "complaint" && hours >= 4) return { text: `${Math.floor(hours)}h`, urgent: true }
  if (hours >= 24) return { text: `${Math.floor(hours / 24)}d`, urgent: true }
  if (hours >= 1) return { text: `${Math.floor(hours)}h`, urgent: false }
  return null
}

export function patchReadStatus(messages, readUpToSequence) {
  if (!readUpToSequence) return messages
  return messages.map((msg) => {
    if (msg.messageType === "system" || !msg.readStatus) return msg
    if (msg.sequence <= readUpToSequence) {
      return { ...msg, readStatus: "read" }
    }
    return msg
  })
}

export const INBOX_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "closed", label: "Closed" },
  { value: "all", label: "All" },
]

export const INBOX_ASSIGNED_OPTIONS = [
  { value: "all", label: "All" },
  { value: "mine", label: "Mine" },
  { value: "unassigned", label: "Unassigned" },
]

export function inboxStatusLabel(value) {
  return INBOX_STATUS_OPTIONS.find((row) => row.value === value)?.label ?? "Open"
}

export function inboxAssignedLabel(value) {
  return INBOX_ASSIGNED_OPTIONS.find((row) => row.value === value)?.label ?? "All"
}

export function inboxEmptyListDescription({ status, assigned }) {
  const statusText = status === "all" ? "" : `${inboxStatusLabel(status).toLowerCase()} `
  const assignedText =
    assigned === "mine"
      ? "assigned to you"
      : assigned === "unassigned"
        ? "unassigned"
        : ""
  if (!statusText && !assignedText) return "Try a different inbox tab or search term."
  if (statusText && assignedText) {
    return `No ${statusText}${assignedText} conversations match your filters.`
  }
  if (assignedText) return `No ${assignedText} conversations right now.`
  return `No ${statusText}conversations right now.`
}

export function messageListPreview(message) {
  if (!message) return ""
  const body = message.body?.trim()
  if (body) return body
  if (message.messageType === "image") return "Photo"
  if (message.messageType === "file") return "Attachment"
  return ""
}

export function patchConversationList(conversations, payload, activeId) {
  const { conversationId, message } = payload
  if (!conversationId || !message) return conversations

  const preview = messageListPreview(message)

  const updated = conversations.map((c) => {
    if (c.id !== conversationId) return c
    return {
      ...c,
      lastMessagePreview: preview || c.lastMessagePreview,
      lastMessageAt: message.createdAt ?? c.lastMessageAt,
      unreadCount: activeId === conversationId ? 0 : (c.unreadCount ?? 0) + 1,
    }
  })

  const exists = updated.some((c) => c.id === conversationId)
  if (!exists) return updated

  return updated.sort(
    (a, b) => new Date(b.lastMessageAt ?? 0).getTime() - new Date(a.lastMessageAt ?? 0).getTime(),
  )
}
