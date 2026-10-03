import { NavLink } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function navItemActive(itemUrl, pathname, search) {
  if (itemUrl.includes("?")) {
    const [path, query] = itemUrl.split("?")
    return pathname === path && search === `?${query}`
  }
  if (itemUrl === "/dashboard") {
    return pathname === "/dashboard"
  }
  if (itemUrl === "/payouts") {
    return pathname.startsWith("/payouts") && (!search || search === "" || !search.includes("tab=refunds"))
  }
  return pathname.startsWith(itemUrl)
}

export function NavMain({ items, pathname = "", search = "" }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workspace</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const isActive = navItemActive(item.url, pathname, search)

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                tooltip={item.title}
                isActive={isActive}
                render={<NavLink to={item.url} />}
              >
                {item.icon}
                <span>{item.title}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] font-medium text-primary-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </SidebarMenuButton>
            </SidebarMenuItem>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
