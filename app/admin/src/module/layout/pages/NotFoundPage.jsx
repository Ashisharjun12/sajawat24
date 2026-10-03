import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"

export function NotFoundPage({ standalone = false }) {
  const wrapperClass = standalone
    ? "flex min-h-[100dvh] flex-col items-center justify-center px-4 text-center"
    : "flex flex-1 flex-col items-center justify-center py-16 text-center"

  return (
    <div className={wrapperClass}>
      <p className="font-heading text-6xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="mt-4 font-heading text-2xl font-extrabold tracking-tight">Page not found</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        This URL does not match any page in the admin.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild className="rounded-lg">
          <Link to="/dashboard">Back to dashboard</Link>
        </Button>
        {standalone ? (
          <Button asChild variant="outline" className="rounded-lg">
            <Link to="/login">Sign in</Link>
          </Button>
        ) : null}
      </div>
    </div>
  )
}
