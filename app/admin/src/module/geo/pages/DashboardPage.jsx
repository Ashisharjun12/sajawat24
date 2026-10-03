import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { getDashboardOverview } from "@/api/dashboard.api"
import { getApiError } from "@/api/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { BookingStatusChart } from "@/module/dashboard/components/BookingStatusChart"
import { BookingsTrendChart } from "@/module/dashboard/components/BookingsTrendChart"
import { DashboardKpiCards } from "@/module/dashboard/components/DashboardKpiCards"
import { RecentBookingsCard } from "@/module/dashboard/components/RecentBookingsCard"

export function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [overview, setOverview] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        const data = await getDashboardOverview()
        if (!cancelled) setOverview(data)
      } catch (err) {
        if (!cancelled) setError(getApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-heading text-2xl font-medium tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Platform overview — bookings, vendors, and revenue at a glance.
        </p>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <DashboardKpiCards kpis={overview?.kpis} loading={loading} />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-stretch">
        <BookingStatusChart items={overview?.bookingsByStatus} loading={loading} />
        <BookingsTrendChart items={overview?.bookingsByMonth} loading={loading} />
      </div>

      <RecentBookingsCard items={overview?.recentBookings} loading={loading} />

      <p className="text-sm text-muted-foreground">
        <Link to="/locations" className="underline-offset-4 hover:underline">
          Manage locations →
        </Link>
      </p>
    </div>
  )
}
