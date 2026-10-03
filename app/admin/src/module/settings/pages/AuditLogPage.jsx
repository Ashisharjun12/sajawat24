import { useCallback, useEffect, useState } from "react"
import { listAuditLogs } from "@/api/audit.api"
import { getApiError } from "@/api/api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ListPagination } from "@/module/geo/components/ListPagination"

const LIMIT = 20

const ACTION_OPTIONS = [
  { value: "all", label: "All actions" },
  { value: "order.vendor_assigned", label: "Vendor assigned" },
  { value: "order.vendor_reassigned", label: "Vendor reassigned" },
  { value: "vendor.status_changed", label: "Vendor status changed" },
  { value: "settings.notification_channels_updated", label: "Notification channels" },
  { value: "settings.payment_methods_updated", label: "Payment methods" },
  { value: "settings.payout_policy_updated", label: "Payout policy" },
  { value: "settings.booking_policy_updated", label: "Booking policy" },
  { value: "settings.ai_policy_updated", label: "AI policy" },
  { value: "ai.catalog_product_copy_generated", label: "Catalog AI copy" },
]

const ENTITY_OPTIONS = [
  { value: "all", label: "All entities" },
  { value: "order", label: "Order" },
  { value: "vendor", label: "Vendor" },
  { value: "settings", label: "Settings" },
]

function formatWhen(value) {
  if (!value) return "—"
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

export function AuditLogPage() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [action, setAction] = useState("all")
  const [entityType, setEntityType] = useState("all")
  const [entityId, setEntityId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listAuditLogs({
        page,
        limit: LIMIT,
        action: action === "all" ? undefined : action,
        entityType: entityType === "all" ? undefined : entityType,
        entityId: entityId.trim() || undefined,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, action, entityType, entityId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    setPage(1)
  }, [action, entityType, entityId])

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Action</Label>
          <Select value={action} onValueChange={setAction}>
            <SelectTrigger>
              <SelectValue placeholder="All actions" />
            </SelectTrigger>
            <SelectContent>
              {ACTION_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Entity type</Label>
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger>
              <SelectValue placeholder="All entities" />
            </SelectTrigger>
            <SelectContent>
              {ENTITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="entity-id">Entity ID</Label>
          <Input
            id="entity-id"
            placeholder="Order or vendor UUID"
            value={entityId}
            onChange={(event) => setEntityId(event.target.value)}
          />
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="rounded-2xl border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Actor</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Summary</TableHead>
              <TableHead>Entity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={5}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  No audit entries match these filters.
                </TableCell>
              </TableRow>
            ) : (
              items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {formatWhen(row.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{row.actorName ?? row.actorId}</TableCell>
                  <TableCell className="font-mono text-xs">{row.action}</TableCell>
                  <TableCell className="max-w-md text-sm">{row.summary}</TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.entityType}:{row.entityId}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
    </div>
  )
}
