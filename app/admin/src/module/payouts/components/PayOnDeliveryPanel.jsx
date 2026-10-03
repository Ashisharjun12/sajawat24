import { useCallback, useEffect, useMemo, useState } from "react"
import { BanknoteIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { getCodPendingOrders } from "@/api/payouts.api"
import { getPayoutPolicy, patchPayoutPolicy } from "@/api/settings.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "@/components/ui/toast"
import { CodPendingOrdersTable } from "@/module/payouts/components/CodPendingOrdersTable"
import { CodPendingFilters } from "@/module/payouts/filters/payout-filters"
import { RupeesPolicyInput } from "@/components/RupeesPolicyInput"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

export function PayOnDeliveryPanel({ sub = "awaiting", onSubChange }) {
  return (
    <Tabs value={sub} onValueChange={onSubChange}>
      <TabsList>
        <TabsTrigger value="awaiting">Awaiting collection</TabsTrigger>
        <TabsTrigger value="rules">Pay on delivery rules</TabsTrigger>
      </TabsList>

      <TabsContent value="awaiting" className="pt-4">
        <AwaitingCollectionList />
      </TabsContent>
      <TabsContent value="rules" className="pt-4">
        <PayOnDeliveryRules />
      </TabsContent>
    </Tabs>
  )
}

function AwaitingCollectionList() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [status, setStatus] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const listParams = useMemo(
    () => ({
      page,
      limit: LIMIT,
      q: debouncedSearch || undefined,
      status: status || undefined,
    }),
    [page, debouncedSearch, status],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await getCodPendingOrders(listParams)
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [listParams])

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    load()
  }, [load])

  const searched = Boolean(debouncedSearch) || Boolean(status)
  const empty = !loading && items.length === 0

  function onSearchChange(event) {
    setSearch(event.target.value)
    setPage(1)
  }

  function onStatusChange(next) {
    setStatus(next)
    setPage(1)
  }

  return (
    <div className="flex flex-col gap-4">
      <CodPendingFilters
        q={search}
        status={status}
        onQ={onSearchChange}
        onStatus={onStatusChange}
      />

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {empty ? (
        <Empty className="border">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <BanknoteIcon />
            </EmptyMedia>
            <EmptyTitle>{searched ? "No orders match" : "No COD orders awaiting collection"}</EmptyTitle>
            <EmptyDescription>
              {searched
                ? "Try a different reference, customer, phone, city, or status."
                : "Pay on delivery bookings show here until cash or UPI is collected at the door."}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="flex flex-col gap-3">
          <CodPendingOrdersTable items={items} loading={loading} />
          <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
        </div>
      )}
    </div>
  )
}

function PayOnDeliveryRules() {
  const [policy, setPolicy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPayoutPolicy()
      .then((data) => {
        if (!cancelled) setPolicy(data)
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: getApiError(err), type: "error" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  async function onSave() {
    if (!policy) return
    setSaving(true)
    try {
      const next = await patchPayoutPolicy({
        codMaxDuePaise: policy.codMaxDuePaise,
        autoNetCodFromEarnings: policy.autoNetCodFromEarnings,
      })
      setPolicy(next)
      toast.add({ title: "COD policy saved", type: "success" })
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <Skeleton className="h-64 w-full" />
  }

  if (!policy) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pay on delivery rules</CardTitle>
        <CardDescription>
          Vendors collect at the door via cash swipe or dynamic UPI QR. Platform commission becomes
          COD due when the job completes.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5 md:grid-cols-2">
        <RupeesPolicyInput
          id="codMaxDuePaise"
          label="COD dues cap"
          valuePaise={policy.codMaxDuePaise}
          onChangePaise={(codMaxDuePaise) => setPolicy({ ...policy, codMaxDuePaise })}
          min={0}
          step={100}
          hint="Vendors over this cap cannot receive new assignments until dues are cleared."
        />
        <div className="md:col-span-2">
          <Button onClick={() => void onSave()} disabled={saving}>
            {saving ? "Saving…" : "Save COD policy"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
