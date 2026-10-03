import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { motion, useReducedMotion } from "framer-motion"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { login } from "@/api/auth.api"
import { getApiError } from "@/api/api"
import { loginSchema } from "@/module/auth/schema"
import { adminHomePath } from "@/module/auth/admin-setup"
import { useAuthStore } from "@/store/auth.store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { DecoryLogo } from "@/components/decory-logo"

export function LoginForm({
  className,
  ...props
}) {
  const navigate = useNavigate()
  const setSession = useAuthStore((s) => s.setSession)
  const reduceMotion = useReducedMotion()
  const [showPassword, setShowPassword] = useState(false)
  const [apiError, setApiError] = useState("")

  const hintEmail = import.meta.env.VITE_ADMIN_HINT_EMAIL?.trim() || ""

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: hintEmail,
      password: "",
    },
  })

  async function onSubmit(values) {
    setApiError("")
    try {
      const payload = await login(values)
      if (!payload?.user || payload.user.role !== "admin") {
        setApiError("This account cannot access admin")
        return
      }
      setSession(payload)
      navigate(adminHomePath(payload.user), { replace: true })
    } catch (err) {
      setApiError(getApiError(err))
    }
  }

  return (
    <form
      className={cn("flex flex-col gap-6", className)}
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      {...props}
    >
      <FieldGroup>
        <div className="flex flex-col items-center gap-3 text-center">
          <DecoryLogo className="size-16" />
          <div className="flex flex-col gap-1">
            <h1 className="font-heading text-3xl font-medium tracking-tight">Decorbuddys</h1>
            <p className="text-sm text-muted-foreground">
              Use your admin email and password.
            </p>
          </div>
        </div>

        {apiError ? (
          <Alert variant="destructive">
            <AlertDescription>{apiError}</AlertDescription>
          </Alert>
        ) : null}

        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                {...field}
                id="email"
                type="email"
                autoComplete="username"
                inputMode="email"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  {...field}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  aria-invalid={fieldState.invalid}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton
                    type="button"
                    size="icon-xs"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
              {fieldState.invalid ? <FieldError errors={[fieldState.error]} /> : null}
            </Field>
          )}
        />

        <Field>
          <motion.div whileTap={reduceMotion ? undefined : { scale: 0.98 }}>
            <Button
              type="submit"
              className="w-full"
              disabled={form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? <Spinner /> : null}
              Sign in
            </Button>
          </motion.div>
        </Field>
      </FieldGroup>
    </form>
  )
}
