import { cn } from "@/lib/utils"

const LIGHT_SRC = "https://ik.imagekit.io/aevhlnk0h/decoryy-light.png"
const DARK_SRC = "https://ik.imagekit.io/aevhlnk0h/decoryy-dark.png"

export function DecoryLogo({ className }) {
  return (
    <span
      className={cn("relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%]", className)}
      role="img"
      aria-label="Decory"
    >
      <img src={LIGHT_SRC} alt="" className="size-full object-cover dark:hidden" />
      <img src={DARK_SRC} alt="" className="hidden size-full object-cover dark:block" />
    </span>
  )
}
