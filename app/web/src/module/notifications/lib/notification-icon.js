import {
  BellIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  CheckCircle2Icon,
  KeyRoundIcon,
  MapPinIcon,
  MessageCircleIcon,
  PackageIcon,
  TruckIcon,
} from "lucide-react"

const DEFAULT_APPEARANCE = {
  wrap: "bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-300",
}

const EVENT_APPEARANCE = {
  CHAT_MESSAGE: {
    wrap: "bg-sky-100 text-sky-600 dark:bg-sky-950/60 dark:text-sky-400",
  },
  BOOKING_CONFIRMED: {
    wrap: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400",
  },
  BOOKING_ASSIGNED: {
    wrap: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
  },
  VENDOR_NEW_JOB: {
    wrap: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400",
  },
  BOOKING_REMINDER: {
    wrap: "bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-400",
  },
  VENDOR_EN_ROUTE: {
    wrap: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  },
  VENDOR_ON_THE_WAY: {
    wrap: "bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-400",
  },
  VENDOR_ON_SITE: {
    wrap: "bg-teal-100 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400",
  },
  BOOKING_COMPLETED: {
    wrap: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
  },
  DELIVERY_CODE: {
    wrap: "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400",
  },
}

export function getNotificationIcon(event) {
  switch (event) {
    case "CHAT_MESSAGE":
      return MessageCircleIcon
    case "BOOKING_CONFIRMED":
      return CalendarCheckIcon
    case "BOOKING_REMINDER":
      return CalendarClockIcon
    case "BOOKING_COMPLETED":
      return CheckCircle2Icon
    case "VENDOR_NEW_JOB":
    case "BOOKING_ASSIGNED":
      return PackageIcon
    case "VENDOR_EN_ROUTE":
    case "VENDOR_ON_THE_WAY":
      return TruckIcon
    case "VENDOR_ON_SITE":
      return MapPinIcon
    case "DELIVERY_CODE":
      return KeyRoundIcon
    default:
      return BellIcon
  }
}

export function getNotificationIconAppearance(event) {
  return EVENT_APPEARANCE[event] ?? DEFAULT_APPEARANCE
}
