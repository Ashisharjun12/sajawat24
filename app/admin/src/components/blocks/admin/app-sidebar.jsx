import { NavLink, useLocation } from "react-router-dom"
import { useEffect } from "react"
import { ADMIN_ACCOUNT_SETUP_PATH, adminNeedsSetup } from "@/module/auth/admin-setup"
import { useAuthStore } from "@/store/auth.store"
import { LayoutDashboardIcon, MapPinIcon, ImagesIcon, TagsIcon, TicketPercentIcon, StarIcon, CalendarClockIcon, UsersIcon, Settings, MessageSquareIcon, WalletIcon, LayoutTemplateIcon, PaletteIcon, RotateCcwIcon } from "lucide-react"
import { getUnreadCount } from "@/api/chat.api"
import { useChatStore } from "@/store/chat.store"
import { NavMain } from "@/components/blocks/admin/nav-main"
import { NavUser } from "@/components/blocks/admin/nav-user"
import { DecoryLogo } from "@/components/decory-logo"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: <LayoutDashboardIcon />,
  },
  {
    title: "Operational locations",
    url: "/locations",
    icon: <MapPinIcon />,
  },
  {
    title: "Media",
    url: "/media",
    icon: <ImagesIcon />,
  },
  {
    title: "Catalog",
    url: "/catalog",
    icon: <TagsIcon />,
  },
  {
    title: "Content",
    url: "/content",
    icon: <LayoutTemplateIcon />,
  },
  {
    title: "Brand",
    url: "/brand",
    icon: <PaletteIcon />,
  },
  {
    title: "Promotions",
    url: "/promotions",
    icon: <TicketPercentIcon />,
  },
  {
    title: "Reviews",
    url: "/reviews",
    icon: <StarIcon />,
  },
  {
    title: "Bookings",
    url: "/bookings",
    icon: <CalendarClockIcon />,
  },
  {
    title: "Inbox",
    url: "/inbox",
    icon: <MessageSquareIcon />,
  },
  {
    title: "People",
    url: "/people",
    icon: <UsersIcon />,
  },
  {
    title: "Payments",
    url: "/payouts",
    icon: <WalletIcon />,
  },
  {
    title: "Customer refunds",
    url: "/payouts?tab=refunds",
    icon: <RotateCcwIcon />,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: <Settings />,
  },
]

export function AppSidebar(props) {
  const location = useLocation()
  const user = useAuthStore((s) => s.user)
  const setupRequired = adminNeedsSetup(user)
  const totalUnreadCount = useChatStore((s) => s.totalUnreadCount)
  const setTotalUnreadCount = useChatStore((s) => s.setTotalUnreadCount)

  useEffect(() => {
    void getUnreadCount()
      .then((data) => setTotalUnreadCount(data.total ?? 0))
      .catch(() => {})
  }, [setTotalUnreadCount])

  const items = setupRequired
    ? []
    : navItems.map((item) =>
        item.url === "/inbox" && totalUnreadCount > 0
          ? { ...item, badge: totalUnreadCount }
          : item,
      )

  const homeTo = setupRequired ? ADMIN_ACCOUNT_SETUP_PATH : "/dashboard"

  return (
    <Sidebar
      className="top-(--header-height) h-[calc(100svh-var(--header-height))]!"
      {...props}
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<NavLink to={homeTo} />}>
              <DecoryLogo />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">Decorbuddys</span>
                <span className="truncate text-xs">Admin</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={items} pathname={location.pathname} search={location.search} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
}
