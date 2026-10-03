import { CheckIcon, CheckCheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function MessageReceiptIcon({ status, className }) {
  if (!status) return null
  if (status === "read") {
    return <CheckCheckIcon className={cn("size-3.5 text-emerald-500", className)} />
  }
  return <CheckIcon className={cn("size-3.5 text-muted-foreground", className)} />
}
