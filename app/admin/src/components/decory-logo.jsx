import { cn } from "@/lib/utils"

const LIGHT_SRC =
  "https://ik.imagekit.io/aevhlnk0h/sajawat24/sajawat24-icon-light.png"
const DARK_SRC =
  "https://ik.imagekit.io/aevhlnk0h/sajawat24/sajawat24-icon-dark.png"

export function DecoryLogo({ className }) {
  return (
    <span
      className={cn("relative inline-flex size-8 shrink-0 overflow-hidden rounded-[22%]", className)}
      role="img"
      aria-label="sajawat24"
    >
      <img src={LIGHT_SRC} alt="" className="size-full object-contain dark:hidden" />
      <img src={DARK_SRC} alt="" className="hidden size-full object-contain dark:block" />
    </span>
  )
}
