import { useEffect, useMemo, useState } from "react"
import { SearchIcon, StoreIcon, UsersIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { assignVendor, listAssignCandidates } from "@/api/assignments.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { toast } from "@/components/ui/toast"
import { formatBookingSlot } from "@/module/bookings/lib/booking-format"

function vendorActionLabel(vendor) {
  if (vendor.assignmentStatus === "current") return "Current assignee"
  if (vendor.assignmentStatus === "declined") return "Declined earlier"
  if (vendor.dutyStatus === "offline") return "Offline"
  return "Assign"
}

function VendorDutyBadge({ dutyStatus }) {
  if (dutyStatus === "online") {
    return (
      <Badge className="border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
        Online
      </Badge>
    )
  }
  return <Badge variant="secondary">Offline</Badge>
}

function VendorTable({ vendors, assigningId, onAssign, showSections = false }) {
  const recommended = vendors.filter((vendor) => vendor.rank === "same_pin")
  const others = vendors.filter((vendor) => vendor.rank !== "same_pin")

  function renderRows(list) {
    return list.map((vendor) => {
      const isAssigning = assigningId === vendor.id
      const disabled = Boolean(assigningId) || !vendor.assignable
      const actionLabel = vendorActionLabel(vendor)

      return (
        <TableRow key={vendor.id}>
          <TableCell className="font-medium">{vendor.name}</TableCell>
          <TableCell className="text-muted-foreground">{vendor.phone || "—"}</TableCell>
          <TableCell className="font-mono text-sm">{vendor.pincode}</TableCell>
          <TableCell>{vendor.cityName}</TableCell>
          <TableCell>
            {vendor.rank === "same_pin" ? (
              <Badge className="border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
                Same PIN
              </Badge>
            ) : (
              <span className="text-sm text-muted-foreground">In city</span>
            )}
          </TableCell>
          <TableCell>
            <VendorDutyBadge dutyStatus={vendor.dutyStatus} />
          </TableCell>
          <TableCell className="text-right">
            <Button
              type="button"
              size="sm"
              variant={vendor.assignmentStatus === "current" ? "secondary" : "default"}
              disabled={disabled}
              title={
                vendor.dutyStatus === "offline" && vendor.assignable === false
                  ? "Vendor is offline"
                  : undefined
              }
              onClick={() => void onAssign(vendor.id)}
            >
              {isAssigning ? "Assigning…" : actionLabel}
            </Button>
          </TableCell>
        </TableRow>
      )
    })
  }

  function SectionLabel({ children }) {
    return (
      <TableRow className="bg-muted/40 hover:bg-muted/40">
        <TableCell colSpan={7} className="py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {children}
        </TableCell>
      </TableRow>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Vendor</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>PIN</TableHead>
            <TableHead>City</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-24 text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {showSections && recommended.length > 0 ? (
            <>
              <SectionLabel>Recommended</SectionLabel>
              {renderRows(recommended)}
            </>
          ) : null}
          {showSections && others.length > 0 ? (
            <>
              <SectionLabel>Other in city</SectionLabel>
              {renderRows(others)}
            </>
          ) : null}
          {!showSections ? renderRows(vendors) : null}
          {showSections && recommended.length === 0 && others.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                No vendors to display.
              </TableCell>
            </TableRow>
          ) : null}
        </TableBody>
      </Table>
    </div>
  )
}

function EmptyVendors({ pinFilter }) {
  const isRecommended = pinFilter === "recommended"
  const isSamePin = pinFilter === "same_pin"

  return (
    <Empty className="border-0 py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          {isRecommended ? <UsersIcon /> : <StoreIcon />}
        </EmptyMedia>
        <EmptyTitle>No vendors found</EmptyTitle>
        <EmptyDescription>
          {isSamePin || isRecommended
            ? "No active vendors on this delivery PIN."
            : "No active vendors in this city match your search."}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function AssignVendorDialog({ open, onOpenChange, order, onAssigned }) {
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [pinFilter, setPinFilter] = useState("all")
  const [onlineOnly, setOnlineOnly] = useState(true)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [assigningId, setAssigningId] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setDebouncedSearch("")
      setPinFilter("all")
      setOnlineOnly(true)
      setAssigningId("")
      setItems([])
      return
    }
  }, [open])

  useEffect(() => {
    if (!open || !order?.id) return

    let cancelled = false
    setLoading(true)
    const samePin = pinFilter === "same_pin" || pinFilter === "recommended"

    void listAssignCandidates(order.id, {
      q: debouncedSearch || undefined,
      samePin,
    })
      .then((data) => {
        if (!cancelled) setItems(data?.items ?? [])
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
  }, [open, order?.id, debouncedSearch, pinFilter])

  const displayedVendors = useMemo(() => {
    let list = items
    if (pinFilter === "recommended") {
      list = list.filter((vendor) => vendor.rank === "same_pin")
    }
    if (onlineOnly) {
      list = list.filter((vendor) => vendor.dutyStatus === "online")
    }
    return list
  }, [items, pinFilter, onlineOnly])

  async function onAssign(vendorId) {
    if (!order?.id || !vendorId || assigningId) return
    setAssigningId(vendorId)
    try {
      const updated = await assignVendor(order.id, vendorId)
      toast.add({ title: "Vendor assigned", type: "success" })
      onAssigned?.(updated)
      onOpenChange(false)
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setAssigningId("")
    }
  }

  const showSections = pinFilter === "all"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(85vh,760px)] flex-col gap-0 overflow-hidden p-0 sm:max-w-4xl">
        <DialogHeader className="border-b border-border p-6 pb-4">
          <DialogTitle>Assign decorator</DialogTitle>
          <DialogDescription>
            {order?.delivery?.cityName} · PIN {order?.delivery?.pincode} ·{" "}
            {formatBookingSlot(order?.scheduledAt)}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 border-b border-border px-6 py-4">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or phone"
              className="pl-9"
            />
          </div>
          <ToggleGroup
            type="single"
            value={pinFilter}
            onValueChange={(value) => {
              if (value) setPinFilter(value)
            }}
            variant="outline"
            size="sm"
            className="flex-wrap justify-start"
          >
            <ToggleGroupItem value="all" className="px-3">
              All in city
            </ToggleGroupItem>
            <ToggleGroupItem value="recommended" className="px-3">
              Recommended
            </ToggleGroupItem>
            <ToggleGroupItem value="same_pin" className="px-3">
              Same PIN only
            </ToggleGroupItem>
          </ToggleGroup>
          <ToggleGroup
            type="single"
            value={onlineOnly ? "online" : "all_duty"}
            onValueChange={(value) => {
              if (value) setOnlineOnly(value === "online")
            }}
            variant="outline"
            size="sm"
            className="flex-wrap justify-start"
          >
            <ToggleGroupItem value="online" className="px-3">
              Online only
            </ToggleGroupItem>
            <ToggleGroupItem value="all_duty" className="px-3">
              Include offline
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <ScrollArea className="min-h-[280px] flex-1 px-6 py-4">
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : displayedVendors.length === 0 ? (
            <EmptyVendors pinFilter={pinFilter} />
          ) : (
            <VendorTable
              vendors={displayedVendors}
              assigningId={assigningId}
              onAssign={onAssign}
              showSections={showSections}
            />
          )}
        </ScrollArea>

        <DialogFooter className="border-t border-border p-6 pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
