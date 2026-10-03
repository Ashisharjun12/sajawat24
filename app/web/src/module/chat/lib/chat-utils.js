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

export function formatMessageTime(iso) {
  if (!iso) return ""
  const date = new Date(iso)
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
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
