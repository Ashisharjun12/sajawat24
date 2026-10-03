import { Link } from "react-router-dom";
import {
  LogOutIcon,
  MapPinIcon,
  PackageIcon,
  UserRoundIcon,
} from "lucide-react";
import { logout } from "@/api/auth.api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const MENU_LINKS = [
  { label: "Personal Info", href: "/account", icon: UserRoundIcon },
  { label: "My Orders", href: "/account/bookings", icon: PackageIcon },
  { label: "Addresses", href: "/account/addresses", icon: MapPinIcon },
];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) {
    return "U";
  }
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function firstName(name = "") {
  return name.trim().split(/\s+/).filter(Boolean)[0] || "Account";
}

export function UserMenu({ className, variant = "header", onNavigate }) {
  const user = useAuthStore((s) => s.user);
  const clear = useAuthStore((s) => s.clear);

  if (!user) {
    return null;
  }

  async function onLogout() {
    try {
      await logout();
    } catch {
      // still clear local session
    }
    clear();
    onNavigate?.();
  }

  const name = user.name || "Account";

  if (variant === "iconToolbar") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-9 shrink-0 overflow-hidden rounded-full p-0 ring-1 ring-border",
                className,
              )}
              aria-label="Account menu"
            />
          }
        >
          <Avatar size="sm" className="size-9 rounded-full">
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="rounded-full bg-primary text-xs font-semibold text-primary-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal text-foreground">
              <span className="block truncate text-sm font-medium">{name}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {MENU_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  className="cursor-pointer"
                  render={<Link to={item.href} />}
                >
                  <Icon />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={onLogout}
            >
              <LogOutIcon />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "iconBrand" || variant === "iconHero") {
    const onHero = variant === "iconHero";
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "size-9 rounded-full border hover:text-background",
                onHero
                  ? "border-background/25 bg-background/10 text-background hover:bg-background/20"
                  : "border-primary-foreground/20 bg-primary-foreground/15 text-primary-foreground hover:bg-primary-foreground/25 hover:text-primary-foreground",
                className,
              )}
            />
          }
        >
          <Avatar size="sm" className="size-7">
            {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
            <AvatarFallback className="bg-background text-[10px] text-foreground">
              {initials(name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-52">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal text-foreground">
              <span className="block truncate text-sm font-medium">{name}</span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {MENU_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <DropdownMenuItem
                  key={item.href}
                  className="cursor-pointer"
                  render={<Link to={item.href} />}
                >
                  <Icon />
                  {item.label}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem
              variant="destructive"
              className="cursor-pointer"
              onClick={onLogout}
            >
              <LogOutIcon />
              Logout
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === "sheet") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        <Button
          type="button"
          nativeButton={false}
          className="h-11 w-full rounded-full bg-primary text-base font-semibold text-black hover:bg-primary/85"
          render={<Link to="/account" onClick={onNavigate} />}
        >
          Manage profile
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="h-11 w-full rounded-full text-base font-semibold"
          onClick={onLogout}
        >
          Sign out
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "hidden h-10 cursor-pointer rounded-full border-border pr-3 pl-2 sm:inline-flex",
              className,
            )}
          />
        }
      >
        <Avatar size="sm" className="size-[26px]">
          {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
          <AvatarFallback className="bg-linear-to-br from-primary to-rose-400 text-[10px] text-primary-foreground">
            {initials(name)}
          </AvatarFallback>
        </Avatar>
        <span className="max-w-[8rem] truncate">{firstName(name)}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-52">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal text-foreground">
            <span className="block truncate text-sm font-medium">{name}</span>
            {user.email ? (
              <span className="block truncate text-xs text-muted-foreground">
                {user.email}
              </span>
            ) : null}
            {!user.phone ? (
              <Link
                to="/account"
                className="mt-0.5 block text-xs font-medium text-primary hover:underline"
              >
                Add phone for bookings
              </Link>
            ) : null}
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {MENU_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <DropdownMenuItem
                key={item.href}
                className="cursor-pointer"
                render={<Link to={item.href} />}
              >
                <Icon />
                {item.label}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            variant="destructive"
            className="cursor-pointer"
            onClick={onLogout}
          >
            <LogOutIcon />
            Logout
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
