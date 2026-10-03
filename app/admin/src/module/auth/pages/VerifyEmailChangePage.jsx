import { useEffect, useRef, useState } from "react"
import { Link, useSearchParams } from "react-router-dom"
import { getApiError } from "@/api/api"
import { verifyAdminEmailChange } from "@/api/account.api"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

export function VerifyEmailChangePage() {
  const [params] = useSearchParams()
  const token = params.get("token") ?? ""
  const [state, setState] = useState("loading")
  const [email, setEmail] = useState("")
  const [passwordUpdated, setPasswordUpdated] = useState(false)
  const [message, setMessage] = useState("")
  const verifyStarted = useRef(false)

  useEffect(() => {
    if (!token) {
      setState("error")
      setMessage("Missing verification token.")
      return
    }
    if (verifyStarted.current) return
    verifyStarted.current = true
    let cancelled = false
    verifyAdminEmailChange(token)
      .then((data) => {
        if (cancelled) return
        setEmail(data.email ?? "")
        setPasswordUpdated(Boolean(data.passwordUpdated))
        setState("success")
      })
      .catch((err) => {
        if (cancelled) return
        setState("error")
        setMessage(getApiError(err))
      })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center px-4">
      {state === "loading" ? (
        <Spinner className="size-8" />
      ) : null}
      {state === "success" ? (
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-medium">Account verified</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {passwordUpdated
              ? `Sign in with ${email} and the new password you chose.`
              : `You can now sign in with ${email}.`}
          </p>
          <Button asChild className="mt-6">
            <Link to="/login">Go to login</Link>
          </Button>
        </div>
      ) : null}
      {state === "error" ? (
        <div className="max-w-md text-center">
          <h1 className="font-heading text-2xl font-medium">Verification failed</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/login">Back to login</Link>
          </Button>
        </div>
      ) : null}
    </div>
  )
}
