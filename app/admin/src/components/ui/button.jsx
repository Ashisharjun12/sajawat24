import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonBase =
  "group/button inline-flex shrink-0 items-center justify-center rounded-[var(--r-btn)] border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all duration-100 outline-none select-none focus-visible:border-ring focus-visible:ring-[2px] focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

const buttonVariants = cva(buttonBase, {
  variants: {
    variant: {
      default:
        "border-transparent bg-[var(--brand-button)] text-[var(--brand-button-fg)] shadow-sm hover:bg-[var(--brand-button-hover)] hover:text-[var(--brand-button-fg)] focus-visible:ring-[var(--brand-button)]/40",
      outline:
        "border-border bg-background hover:bg-[var(--brand-surface-hover)] hover:text-foreground aria-expanded:bg-[var(--brand-surface-active)] aria-expanded:text-foreground dark:bg-transparent dark:hover:bg-[var(--brand-surface-hover)] dark:hover:text-foreground",
      secondary:
        "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground dark:hover:bg-[var(--brand-surface-hover)]",
      ghost:
        "hover:bg-[var(--brand-surface-hover)] hover:text-foreground aria-expanded:bg-[var(--brand-surface-active)] aria-expanded:text-foreground dark:hover:bg-[var(--brand-surface-hover)] dark:hover:text-foreground",
      destructive:
        "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
      link: "text-primary underline-offset-4 hover:underline active:scale-100",
    },
    size: {
      default:
        "h-9 gap-1.5 px-3 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5",
      xs: "h-6 gap-1 px-2.5 text-xs has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
      sm: "h-8 gap-1 px-3 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
      lg: "h-10 gap-1.5 px-4 has-data-[icon=inline-end]:pr-3 has-data-[icon=inline-start]:pl-3",
      cta: "h-12 gap-2 px-5 text-base md:h-11 md:text-sm",
      icon: "size-9 rounded-[var(--r-btn)]",
      "icon-xs": "size-6 [&_svg:not([class*='size-'])]:size-3",
      "icon-sm": "size-8",
      "icon-lg": "size-10",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
})

function Button({
  className,
  variant = "default",
  size = "default",
  render,
  nativeButton,
  ...props
}) {
  const resolvedNativeButton = nativeButton ?? (render != null ? false : true)
  return (
    <ButtonPrimitive
      data-slot="button"
      nativeButton={resolvedNativeButton}
      render={render}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
