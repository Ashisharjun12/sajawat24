import { useEffect, useRef, useState } from "react"
import { CHAT_TYPING_EVENT } from "@/module/chat/lib/chat.events"
import { useSocket } from "@/providers/socket-provider"

const TYPING_IDLE_MS = 3000

export function useConversationTyping(conversationId, draft, ownRole) {
  const { socket } = useSocket()
  const [otherTyping, setOtherTyping] = useState(false)
  const lastEmittedRef = useRef(null)
  const hideTimerRef = useRef(null)
  const idleTimerRef = useRef(null)

  useEffect(() => {
    if (!socket || !conversationId) return undefined

    function emitTyping(isTyping) {
      if (lastEmittedRef.current === isTyping) return
      lastEmittedRef.current = isTyping
      socket.emit(CHAT_TYPING_EVENT, { conversationId, isTyping })
    }

    if (!draft.trim()) {
      emitTyping(false)
      return undefined
    }

    emitTyping(true)
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => emitTyping(false), TYPING_IDLE_MS)

    return () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [socket, conversationId, draft])

  useEffect(() => {
    if (!conversationId) return undefined

    function onTyping(payload) {
      if (payload?.conversationId !== conversationId) return
      if (payload?.role === ownRole) return

      setOtherTyping(Boolean(payload.isTyping))
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (payload.isTyping) {
        hideTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_IDLE_MS + 500)
      }
    }

    function onWindowTyping(event) {
      onTyping(event.detail)
    }

    socket?.on(CHAT_TYPING_EVENT, onTyping)
    window.addEventListener(CHAT_TYPING_EVENT, onWindowTyping)
    return () => {
      socket?.off(CHAT_TYPING_EVENT, onTyping)
      window.removeEventListener(CHAT_TYPING_EVENT, onWindowTyping)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [socket, conversationId, ownRole])

  useEffect(() => {
    return () => {
      if (socket && conversationId && lastEmittedRef.current) {
        socket.emit(CHAT_TYPING_EVENT, { conversationId, isTyping: false })
      }
    }
  }, [socket, conversationId])

  return { otherTyping }
}
