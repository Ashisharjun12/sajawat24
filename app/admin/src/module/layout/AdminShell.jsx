import { Outlet } from "react-router-dom"
import { SocketProvider } from "@/providers/socket-provider"

export function AdminShell() {
  return (
    <SocketProvider>
      <Outlet />
    </SocketProvider>
  )
}
