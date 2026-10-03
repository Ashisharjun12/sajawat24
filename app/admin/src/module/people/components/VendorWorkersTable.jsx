import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { clipText } from "@/module/people/lib/people-format"
import {
  PEOPLE_CELL,
  PEOPLE_HEAD,
  PEOPLE_TABLE_WRAP,
} from "@/module/people/lib/people-table"

const SKELETON_ROWS = 4
const TEXT_LIMIT = 14

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

function MemberStatusBadge({ status }) {
  const normalized = String(status ?? "").toLowerCase()
  const label =
    normalized === "active"
      ? "Active"
      : normalized === "invited"
        ? "Invited"
        : normalized === "disabled"
          ? "Disabled"
          : status || "—"

  const className =
    normalized === "active"
      ? "border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300"
      : normalized === "invited"
        ? "border-transparent bg-amber-500/15 text-amber-900 dark:text-amber-200"
        : undefined

  return (
    <Badge variant="secondary" className={className}>
      {label}
    </Badge>
  )
}

export function VendorWorkersTable({ items, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: SKELETON_ROWS }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (!items.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No field workers for this shop yet. The owner adds them from the partner app.
      </p>
    )
  }

  return (
    <div className={PEOPLE_TABLE_WRAP}>
      <Table className="w-full table-fixed text-sm">
        <colgroup>
          <col className="w-[8rem]" />
          <col className="w-[6.5rem]" />
          <col className="w-[4.5rem]" />
          <col className="w-[5rem]" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className={PEOPLE_HEAD}>Name</TableHead>
            <TableHead className={PEOPLE_HEAD}>Phone</TableHead>
            <TableHead className={PEOPLE_HEAD}>Status</TableHead>
            <TableHead className={PEOPLE_HEAD}>Account</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((member) => (
            <TableRow key={member.id}>
              <TableCell className={`${PEOPLE_CELL} text-sm font-medium`}>
                <ClippedCell value={member.displayName} />
              </TableCell>
              <TableCell className={`${PEOPLE_CELL} text-sm`}>
                <ClippedCell value={member.phone} mono />
              </TableCell>
              <TableCell className={PEOPLE_CELL}>
                <MemberStatusBadge status={member.status} />
              </TableCell>
              <TableCell className={`${PEOPLE_CELL} text-sm text-muted-foreground`}>
                {member.userId ? "Linked" : "Invite pending"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
