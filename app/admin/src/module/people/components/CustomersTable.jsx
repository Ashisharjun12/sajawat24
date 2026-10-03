import { BanIcon, EyeIcon, MoreHorizontalIcon, ShieldCheckIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { CustomerStatusBadge } from "@/module/people/components/CustomerStatusBadge"
import { clipText, formatJoinedDate } from "@/module/people/lib/people-format"
import {
  PEOPLE_ACTION_CELL,
  PEOPLE_ACTION_HEAD,
  PEOPLE_CELL,
  PEOPLE_HEAD,
  PEOPLE_TABLE_WRAP,
} from "@/module/people/lib/people-table"

const SKELETON_ROWS = 6
const TEXT_LIMIT = 9

function ClippedCell({ value, maxLength = TEXT_LIMIT, mono = false }) {
  const full = String(value ?? "").trim() || "—"
  const clipped = clipText(full, maxLength)

  return (
    <span
      className={`block truncate ${mono ? "font-mono" : ""}`}
      title={full !== clipped ? full : undefined}
    >
      {clipped}
    </span>
  )
}

export function CustomersTable({ items, loading, onView, onToggleBlock }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  return (
    <div className={PEOPLE_TABLE_WRAP}>
      <Table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[4.75rem]" />
          <col className="w-[5.25rem]" />
          <col className="w-[4.75rem]" />
          <col className="w-[3.25rem]" />
          <col className="w-[4.25rem]" />
          <col className="w-[5rem]" />
          <col className="w-8" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className={PEOPLE_HEAD}>Name</TableHead>
            <TableHead className={PEOPLE_HEAD}>Phone</TableHead>
            <TableHead className={PEOPLE_HEAD}>Email</TableHead>
            <TableHead className={PEOPLE_HEAD}>Bookings</TableHead>
            <TableHead className={PEOPLE_HEAD}>Status</TableHead>
            <TableHead className={PEOPLE_HEAD}>Joined</TableHead>
            <TableHead className={PEOPLE_ACTION_HEAD} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((customer) => {
            const emailFull = customer.email || "—"
            const emailLabel = clipText(emailFull, TEXT_LIMIT)

            return (
              <TableRow key={customer.id}>
                <TableCell className={`${PEOPLE_CELL} text-sm`}>
                  <ClippedCell value={customer.name} />
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm`}>
                  <ClippedCell value={customer.phone} mono />
                </TableCell>
                <TableCell
                  className={`${PEOPLE_CELL} text-sm`}
                  title={emailFull !== emailLabel ? emailFull : undefined}
                >
                  <span className="block truncate">{emailLabel}</span>
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm tabular-nums`}>
                  {customer.bookingCount ?? 0}
                </TableCell>
                <TableCell className={`${PEOPLE_CELL}`}>
                  <CustomerStatusBadge
                    status={customer.status}
                    className="max-w-full truncate text-[10px]"
                  />
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm text-muted-foreground`}>
                  <span className="block truncate">{formatJoinedDate(customer.createdAt)}</span>
                </TableCell>
                <TableCell className={PEOPLE_ACTION_CELL}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${customer.name}`}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(customer)}>
                        <EyeIcon />
                        View
                      </DropdownMenuItem>
                      {customer.status === "blocked" ? (
                        <DropdownMenuItem onClick={() => onToggleBlock?.(customer, "active")}>
                          <ShieldCheckIcon />
                          Unblock
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onToggleBlock?.(customer, "blocked")}
                        >
                          <BanIcon />
                          Block
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
