import { Outlet, useLocation } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { AppSidebar } from "@/components/blocks/admin/app-sidebar"
import { SiteHeader } from "@/components/blocks/admin/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AiPolicyProvider } from "@/providers/ai-policy-provider"

export function Layout() {
  const { pathname } = useLocation()
  const reduceMotion = useReducedMotion()
  const duration = reduceMotion ? 0 : 0.18
  const isChatSurface = pathname.startsWith("/inbox") || pathname.startsWith("/agent")

  return (
    <AiPolicyProvider>
      <div className="[--header-height:--spacing(14)]">
        <SidebarProvider className="flex h-svh min-h-0 flex-col overflow-hidden">
          <SiteHeader />
          <div className="flex min-h-0 flex-1">
            <AppSidebar />
            <SidebarInset className="min-h-0 overflow-hidden">
              {isChatSurface ? (
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <Outlet />
                </div>
              ) : (
                <motion.div
                  key={pathname}
                  className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 md:p-6"
                  initial={reduceMotion ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Outlet />
                </motion.div>
              )}
            </SidebarInset>
          </div>
        </SidebarProvider>
      </div>
    </AiPolicyProvider>
  )
}

export default Layout
