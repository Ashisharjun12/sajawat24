import { useCallback, useEffect, useMemo, useState } from "react"
import { listMessages, markRead, sendMessage } from "@/api/chat.api"
import { uploadChatAttachment } from "@/module/chat/lib/upload-chat-attachment"
import { getApiError } from "@/api/api"
import {
  dedupeAppend,
  newClientMessageId,
  patchReadStatus,
} from "@/module/chat/lib/chat-utils"
import {
  APP_STATE_EVENT,
  CHAT_BLUR_EVENT,
  CHAT_FOCUS_EVENT,
  CHAT_MESSAGE_EVENT,
  CHAT_READ_EVENT,
} from "@/module/chat/lib/chat.events"
import { useSocket } from "@/providers/socket-provider"
import { useAuthStore } from "@/store/auth.store"
import { useChatStore } from "@/store/chat.store"

export function useChatThreadCore({ enabled, resolveConversation, senderRole = "customer" }) {
  const userId = useAuthStore((s) => s.user?.id)
  const setActiveConversation = useChatStore((s) => s.setActiveConversation)
  const pendingMessages = useChatStore((s) => s.pendingMessages)

  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isSending, setIsSending] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const conversationId = conversation?.id
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket || !conversationId) return undefined
    socket.emit(CHAT_FOCUS_EVENT, { conversationId })
    return () => {
      socket.emit(CHAT_BLUR_EVENT, {})
    }
  }, [socket, conversationId])

  const loadInitial = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError("")
    try {
      const conv = await resolveConversation()
      setConversation(conv)
      setActiveConversation(conv.id)
      const msgs = await listMessages(conv.id)
      setMessages(msgs ?? [])
      const last = msgs?.[msgs.length - 1]
      if (last) await markRead(conv.id, last.id)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [enabled, resolveConversation, setActiveConversation])

  useEffect(() => {
    void loadInitial()
    return () => setActiveConversation(null)
  }, [loadInitial, setActiveConversation])

  useEffect(() => {
    if (!enabled || !conversationId) return undefined

    const timer = setInterval(() => {
      void resolveConversation()
        .then((conv) => {
          setConversation((prev) => {
            if (!prev || prev.id !== conv.id) return prev
            return { ...prev, ...conv }
          })
        })
        .catch(() => {})
    }, 15000)

    return () => clearInterval(timer)
  }, [enabled, conversationId, resolveConversation])

  useEffect(() => {
    if (!conversationId) return undefined

    function onChatMessage(event) {
      const payload = event.detail
      if (payload?.conversationId !== conversationId || !payload?.message) return
      setMessages((prev) => dedupeAppend(prev, payload.message))
      void markRead(conversationId, payload.message.id).catch(() => {})
    }

    function onChatRead(event) {
      const payload = event.detail
      if (payload?.conversationId !== conversationId) return
      setMessages((prev) => patchReadStatus(prev, payload.readUpToSequence))
    }

    window.addEventListener(CHAT_MESSAGE_EVENT, onChatMessage)
    window.addEventListener(CHAT_READ_EVENT, onChatRead)
    return () => {
      window.removeEventListener(CHAT_MESSAGE_EVENT, onChatMessage)
      window.removeEventListener(CHAT_READ_EVENT, onChatRead)
    }
  }, [conversationId])

  const mergedMessages = useMemo(() => {
    const pending = conversationId ? pendingMessages[conversationId] ?? [] : []
    const serverClientIds = new Set(
      messages.map((m) => m.clientMessageId).filter(Boolean),
    )
    const pendingViews = pending
      .filter((p) => !serverClientIds.has(p.clientMessageId))
      .map((p) => ({
      id: p.clientMessageId,
      conversationId: p.conversationId,
      sequence: Number.MAX_SAFE_INTEGER,
      senderUserId: userId ?? null,
      senderRole,
      body: p.body,
      messageType: p.messageType ?? "text",
      attachmentUrl: p.attachmentUri ?? null,
      clientMessageId: p.clientMessageId,
      createdAt: p.createdAt,
      readStatus: "sent",
    }))
    return [...messages, ...pendingViews]
  }, [messages, pendingMessages, conversationId, userId, senderRole])

  const send = useCallback(
    async (body) => {
      if (!conversationId) throw new Error("No conversation")
      const trimmed = body.trim()
      if (!trimmed) return

      const clientMessageId = newClientMessageId()
      useChatStore.getState().addPendingMessage(conversationId, {
        clientMessageId,
        conversationId,
        body: trimmed,
        createdAt: new Date().toISOString(),
      })

      setIsSending(true)
      try {
        const msg = await sendMessage(conversationId, { body: trimmed, clientMessageId })
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId)
        setMessages((prev) => dedupeAppend(prev, msg))
        return msg
      } catch (err) {
        useChatStore.getState().resolvePendingMessage(conversationId, clientMessageId)
        throw err
      } finally {
        setIsSending(false)
      }
    },
    [conversationId],
  )

  const sendAttachment = useCallback(
    async (file) => {
      const activeConversationId = conversationId
      if (!activeConversationId || !file) throw new Error("No conversation")
      const clientMessageId = newClientMessageId()
      const previewUrl = file.type?.startsWith("image/") ? URL.createObjectURL(file) : null

      useChatStore.getState().addPendingMessage(activeConversationId, {
        clientMessageId,
        conversationId: activeConversationId,
        body: file.name,
        createdAt: new Date().toISOString(),
        attachmentUri: previewUrl,
        messageType: file.type?.startsWith("image/") ? "image" : "file",
      })

      setIsUploading(true)
      try {
        const { uploadId, messageType } = await uploadChatAttachment(activeConversationId, file)
        const msg = await sendMessage(activeConversationId, {
          body: messageType === "file" ? file.name : "",
          uploadId,
          messageType,
          clientMessageId,
        })
        useChatStore.getState().resolvePendingMessage(activeConversationId, clientMessageId)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        setMessages((prev) => dedupeAppend(prev, msg))
        return msg
      } catch (err) {
        useChatStore.getState().resolvePendingMessage(activeConversationId, clientMessageId)
        if (previewUrl) URL.revokeObjectURL(previewUrl)
        throw err
      } finally {
        setIsUploading(false)
      }
    },
    [conversationId],
  )

  return {
    conversation,
    messages: mergedMessages,
    loading,
    error,
    isSending,
    isUploading,
    sendMessage: send,
    sendAttachment,
  }
}
