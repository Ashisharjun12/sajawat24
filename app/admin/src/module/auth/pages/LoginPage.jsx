import { motion, useReducedMotion } from "framer-motion"
import { LoginHero } from "@/assets/silhouettes/login-hero"
import { LoginForm } from "@/components/blocks/login/login-form"
import { DecoryLogo } from "@/components/decory-logo"
import { ModeToggle } from "@/components/ui/mode-toggle"

function BrandLockup() {
  return (
    <div className="flex items-center gap-3">
      <DecoryLogo className="size-12" />
      <p className="font-heading text-2xl font-medium tracking-tight">Decorbuddys</p>
    </div>
  )
}

export function LoginPage() {
  const reduceMotion = useReducedMotion()
  const duration = reduceMotion ? 0 : 0.22

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-muted lg:flex lg:flex-col lg:p-12">
        <BrandLockup />
        <div className="flex flex-1 items-center justify-center">
          <LoginHero className="mx-auto h-auto w-auto max-w-md" />
        </div>
      </div>

      <div className="relative flex items-center justify-center p-6 sm:p-10">
        <div className="absolute top-4 right-4">
          <ModeToggle />
        </div>
        <motion.div
          className="w-full max-w-sm"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration, ease: [0.22, 1, 0.36, 1] }}
        >
          <LoginForm />
        </motion.div>
      </div>
    </div>
  )
}
