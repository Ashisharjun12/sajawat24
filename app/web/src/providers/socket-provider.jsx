import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { getSocketUrl } from "@/lib/socket-url"
import { useAuthStore } from "@/store/auth.store"
import {
  APP_STATE_EVENT,
  CHAT_MESSAGE_EVENT,
  CHAT_READ_EVENT,
  CHAT_TYPING_EVENT,
} from "@/module/chat/lib/chat.events"
import { BOOKING_STATUS_EVENT } from "@/module/account/lib/booking.events"
import { requestNotificationsRefresh } from "@/module/notifications/lib/notification-events"
import { useChatStore } from "@/store/chat.store"

const SocketContext = createContext({ socket: null })

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const url = getSocketUrl()
    if (!accessToken || !url) {
      setSocket((current) => {
        current?.disconnect()
        return null
      })
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
        useChatStore.getState().onIncomingMessage?.(payload.conversationId)
        const activeId = useChatStore.getState().activeConversationId
        if (activeId !== payload.conversationId) {
          requestNotificationsRefresh()
        }
      }
      window.dispatchEvent(new CustomEvent(CHAT_MESSAGE_EVENT, { detail: payload }))
    })
    socket.on(CHAT_READ_EVENT, (payload) => {
      window.dispatchEvent(new CustomEvent(CHAT_READ_EVENT, { detail: payload }))
    })
    socket.on(CHAT_TYPING_EVENT, (payload) => {
      window.dispatchEvent(new CustomEvent(CHAT_TYPING_EVENT, { detail: payload }))
    })
    socket.on(BOOKING_STATUS_EVENT, (payload) => {
      window.dispatchEvent(new CustomEvent(BOOKING_STATUS_EVENT, { detail: payload }))
    })

    const emitAppState = () => {
      socket.emit(APP_STATE_EVENT, {
        state: document.visibilityState === "visible" ? "foreground" : "background",
      })
    }

    emitAppState()
    document.addEventListener("visibilitychange", emitAppState)

    setSocket(socket)
    return () => {
      document.removeEventListener("visibilitychange", emitAppState)
      socket.disconnect()
      setSocket(null)
    }
  }, [accessToken])

  return (
    <SocketContext.Provider value={{ socket }}>
      {children}
    </SocketContext.Provider>
  )
}
