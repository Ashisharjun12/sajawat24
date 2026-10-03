import { NavLink } from "react-router-dom";
import {
  BellIcon,
  LifeBuoyIcon,
  MapPinIcon,
  PackageIcon,
  RotateCcwIcon,
  UserRoundIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PRIMARY_NAV = [
  { label: "Personal Info", to: "/account", icon: UserRoundIcon, end: true },
  { label: "My Orders", to: "/account/bookings", icon: PackageIcon, end: false },
  { label: "Addresses", to: "/account/addresses", icon: MapPinIcon, end: false },
  {
    label: "Refunds",
    to: "/account/returns",
    icon: RotateCcwIcon,
    end: false,
  },
];

const SECONDARY_NAV = [
  { label: "Notifications", to: "/account/notifications", icon: BellIcon, end: false },
  { label: "Help", to: "/account/help", icon: LifeBuoyIcon, end: false },
];

function NavItem({ item, mobile }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          mobile ? "shrink-0 whitespace-nowrap" : "w-full",
          isActive
            ? "bg-muted text-foreground"
            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
        )
      }
    >
      <Icon className="size-4 shrink-0 stroke-[1.5]" />
      {item.label}
    </NavLink>
  );
}

export function AccountNav({ variant = "sidebar" }) {
  if (variant === "mobile") {
    return (
      <nav className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...PRIMARY_NAV, ...SECONDARY_NAV].map((item) => (
          <NavItem key={item.to} item={item} mobile />
        ))}
      </nav>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <p className="px-3 text-lg font-bold tracking-tight text-foreground">Account</p>
      <nav className="flex flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>
      <div className="mx-3 border-t border-border" />
      <nav className="flex flex-col gap-0.5">
        {SECONDARY_NAV.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </nav>
    </div>
  );
}
