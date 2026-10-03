import { useLocation } from "react-router-dom"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/ui/mode-toggle"
import { Separator } from "@/components/ui/separator"
import { useSidebar } from "@/components/ui/sidebar"
import { PanelLeftIcon } from "lucide-react"

function pageLabel(pathname) {
  if (pathname.startsWith("/locations")) return "Operational locations"
  if (pathname.startsWith("/catalog")) return "Catalog"
  if (pathname.startsWith("/media")) return "Media"
  if (pathname.startsWith("/bookings")) return "Bookings"
  if (pathname.startsWith("/people")) return "People"
  if (pathname.startsWith("/settings")) return "Settings"
  if (pathname.startsWith("/inbox")) return "Inbox"
  return "Dashboard"
}

export function SiteHeader() {
  const { toggleSidebar } = useSidebar()
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-50 flex w-full items-center border-b bg-background">
      <div className="flex h-(--header-height) w-full items-center gap-2 px-4">
        <Button className="h-8 w-8" variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeftIcon />
        </Button>
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel(pathname)}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto">
          <ModeToggle />
        </div>
      </div>
    </header>
  )
}
