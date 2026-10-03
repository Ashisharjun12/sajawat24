import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { allowSkipAdminPasswordSetup } from "@/module/auth/admin-setup"
import { CheckCircle2, EyeIcon, EyeOffIcon, Mail } from "lucide-react"
import { getApiError } from "@/api/api"
import {
  changeAdminEmail,
  getAdminAccount,
  patchAdminAccountProfile,
  skipAdminPasswordSetup,
} from "@/api/account.api"
import { useAuthStore } from "@/store/auth.store"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

function PasswordInput({ id, value, onChange, autoComplete, visible, onToggleVisible, minLength }) {
  return (
    <InputGroup>
      <InputGroupInput
        id={id}
        type={visible ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        onChange={onChange}
        minLength={minLength}
      />
      <InputGroupAddon align="inline-end">
        <InputGroupButton
          type="button"
          size="icon-xs"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={onToggleVisible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  )
}

function isValidEmail(value) {
  const v = String(value ?? "").trim()
  return v.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

export function AdminAccountPanel() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [account, setAccount] = useState(null)

  const [name, setName] = useState("")
  const [loginEmail, setLoginEmail] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [savingName, setSavingName] = useState(false)
  const [sending, setSending] = useState(false)
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false)
  const [verifyDialogEmail, setVerifyDialogEmail] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [skippingSetup, setSkippingSetup] = useState(false)
  const patchUser = useAuthStore((s) => s.patchUser)
  const navigate = useNavigate()
  const canSkipSetup = allowSkipAdminPasswordSetup()

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getAdminAccount()
      setAccount(data)
      setName(data.name ?? "")
      setLoginEmail(data.email ?? "")
      if (!data.mustChangePassword) {
        patchUser({ mustChangePassword: false })
      }
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [patchUser])

  useEffect(() => {
    void load()
  }, [load])

  const activeLoginEmail = account?.email ?? ""
  const nameChanged = useMemo(
    () => (name ?? "").trim() !== (account?.name ?? "").trim(),
    [name, account?.name]
  )
  const passwordsReady =
    newPassword.length >= 8 && newPassword === confirmPassword && confirmPassword.length >= 8
  const canSendVerification = isValidEmail(loginEmail) && passwordsReady && !sending
  const emailVerified = !account?.pendingEmailChange && Boolean(activeLoginEmail)

  async function saveName() {
    setSavingName(true)
    try {
      const data = await patchAdminAccountProfile({ name })
      setAccount(data)
      toast.add({ title: "Name saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSavingName(false)
    }
  }

  async function continueWithCurrentPassword() {
    setSkippingSetup(true)
    try {
      const data = await skipAdminPasswordSetup()
      setAccount(data)
      patchUser({ mustChangePassword: false })
      toast.add({ title: "You can keep using your current password", type: "success" })
      navigate("/dashboard", { replace: true })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSkippingSetup(false)
    }
  }

  async function sendVerification() {
    setSending(true)
    try {
      const data = await changeAdminEmail({
        newEmail: loginEmail.trim(),
        newPassword,
        confirmNewPassword: confirmPassword,
      })
      setAccount(data)
      setVerifyDialogEmail(loginEmail.trim())
      setVerifyDialogOpen(true)
      setNewPassword("")
      setConfirmPassword("")
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="flex w-full justify-center py-16">
        <Spinner className="size-8" />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-full">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="flex w-full flex-col gap-4">
      {account?.mustChangePassword ? (
        <Alert
          className={
            canSkipSetup
              ? "flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              : "w-full"
          }
        >
          <AlertDescription>
            {canSkipSetup
              ? "First-time setup: verify your email and set a new password, or continue with your current login (local dev only)."
              : "First-time setup: enter your login email and a new password, then open the verification link we send. You cannot use the rest of the admin panel until this is done."}
          </AlertDescription>
          {canSkipSetup ? (
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={skippingSetup}
              onClick={() => void continueWithCurrentPassword()}
            >
              {skippingSetup ? <Spinner className="size-4" /> : null}
              Continue with current password
            </Button>
          ) : null}
        </Alert>
      ) : null}

      <Card className="w-full">
        <CardHeader className="border-b border-border/60">
          <CardTitle>Account</CardTitle>
          <CardDescription>
            One step: we email you a link. Opening it confirms your login email and activates your
            new password.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex w-full flex-col gap-8 pt-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="account-name">Name</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                id="account-name"
                className="min-w-0 flex-1"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                className="shrink-0 sm:w-auto"
                disabled={!nameChanged || savingName}
                onClick={() => void saveName()}
              >
                {savingName ? <Spinner className="size-4" /> : null}
                Save name
              </Button>
            </div>
          </div>

          <div className="grid w-full gap-6 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Label htmlFor="login-email">Login email</Label>
                  {emailVerified ? (
                    <Badge
                      variant="outline"
                      className="border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="size-3" />
                      Verified
                    </Badge>
                  ) : null}
                  {account?.pendingEmailChange ? (
                    <Badge
                      variant="outline"
                      className="border-amber-500/40 bg-amber-500/10 text-amber-800 dark:text-amber-400"
                    >
                      <Mail className="size-3" />
                      Awaiting link
                    </Badge>
                  ) : null}
                </div>
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
                {account?.pendingEmailChange ? (
                  <p className="text-xs text-muted-foreground">
                    Link sent to{" "}
                    <span className="font-medium text-foreground">
                      {account.pendingEmailChange.newEmail}
                    </span>
                    . Until you verify, sign in with{" "}
                    <span className="font-medium text-foreground">{activeLoginEmail}</span>
                    {account.pendingEmailChange.includesPassword
                      ? " and your previous password."
                      : "."}
                  </p>
                ) : activeLoginEmail && loginEmail.trim().toLowerCase() === activeLoginEmail.toLowerCase() ? (
                  <p className="text-xs text-muted-foreground">
                    Keep this email or enter a new one — we always verify from the inbox you choose.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    We will send the verification link to this address.
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-5">
              <div>
                <p className="text-sm font-medium">New password</p>
                <p className="text-xs text-muted-foreground">
                  Applied when you open the verification link (at least 8 characters).
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="new-password">Password</Label>
                <PasswordInput
                  id="new-password"
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  visible={showNewPassword}
                  onToggleVisible={() => setShowNewPassword((v) => !v)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <PasswordInput
                  id="confirm-password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={8}
                  visible={showConfirmPassword}
                  onToggleVisible={() => setShowConfirmPassword((v) => !v)}
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword ? (
                <p className="text-xs text-destructive">Passwords do not match.</p>
              ) : null}
            </div>
          </div>

          <Button
            type="button"
            className="w-full sm:w-auto"
            disabled={!canSendVerification}
            onClick={() => void sendVerification()}
          >
            {sending ? <Spinner className="size-4" /> : null}
            Send verification email
          </Button>
        </CardContent>
      </Card>

      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Check your email</DialogTitle>
            <DialogDescription>
              We sent a link to{" "}
              <span className="font-medium text-foreground">{verifyDialogEmail}</span>. Open it to
              confirm this email and activate your new password. Until then, keep using{" "}
              <span className="font-medium text-foreground">{activeLoginEmail}</span> to sign in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter showCloseButton>
            <Button type="button" onClick={() => setVerifyDialogOpen(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
