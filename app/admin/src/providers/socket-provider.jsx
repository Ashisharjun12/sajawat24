import { createContext, useContext, useEffect, useRef } from "react"
import { io } from "socket.io-client"
import { getSocketUrl } from "@/lib/socket-url"
import { useAuthStore } from "@/store/auth.store"
import { useChatStore } from "@/store/chat.store"

const CHAT_MESSAGE_EVENT = "chat:message"
const CHAT_READ_EVENT = "chat:read"

const SocketContext = createContext({ socket: null })

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef(null)

  useEffect(() => {
    const url = getSocketUrl()
    if (!accessToken || !url) {
      socketRef.current?.disconnect()
      socketRef.current = null
      useChatStore.getState().setConnectionStatus("idle")
      return undefined
    }

    useChatStore.getState().setConnectionStatus("connecting")
    const socket = io(url, {
      auth: { token: accessToken },
      transports: ["websocket", "polling"],
    })

    socket.on("connect", () => useChatStore.getState().setConnectionStatus("connected"))
    socket.on("disconnect", () => useChatStore.getState().setConnectionStatus("disconnected"))
    socket.on(CHAT_MESSAGE_EVENT, (payload) => {
      if (payload?.conversationId) {
        useChatStore.getState().onIncomingMessage(payload.conversationId)
      }
      window.dispatchEvent(new CustomEvent(CHAT_MESSAGE_EVENT, { detail: payload }))
    })
    socket.on(CHAT_READ_EVENT, (payload) => {
      window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT, { detail: payload }))
    })

    socketRef.current = socket
    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  return (
    <SocketContext.Provider value={{ socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  )
}
