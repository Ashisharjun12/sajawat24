import {
  BanIcon,
  CheckIcon,
  EyeIcon,
  MoreHorizontalIcon,
  XIcon,
} from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { VendorStatusBadge } from "@/module/people/components/VendorStatusBadge"
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

export function VendorsTable({
  items,
  loading,
  onView,
  onApprove,
  onReject,
  onBlock,
}) {
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
          <col className="w-[4.25rem]" />
          <col className="w-[5.5rem]" />
          <col className="w-[3.5rem]" />
          <col className="w-[5rem]" />
          <col className="w-8" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead className={PEOPLE_HEAD}>Name</TableHead>
            <TableHead className={PEOPLE_HEAD}>Phone</TableHead>
            <TableHead className={PEOPLE_HEAD}>City</TableHead>
            <TableHead className={PEOPLE_HEAD}>Status</TableHead>
            <TableHead className={PEOPLE_HEAD}>Jobs</TableHead>
            <TableHead className={PEOPLE_HEAD}>Applied</TableHead>
            <TableHead className={PEOPLE_ACTION_HEAD} />
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((vendor) => {
            const jobsLabel = `${vendor.jobCount ?? 0}/${vendor.completedCount ?? 0}`

            return (
              <TableRow key={vendor.id}>
                <TableCell className={`${PEOPLE_CELL} text-sm`}>
                  <ClippedCell value={vendor.name} />
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm`}>
                  <ClippedCell value={vendor.phone} mono />
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm`}>
                  <ClippedCell value={vendor.city} />
                </TableCell>
                <TableCell className={PEOPLE_CELL}>
                  <div className="flex flex-col gap-1">
                    <VendorStatusBadge
                      status={vendor.onboardingStatus}
                      className="max-w-full truncate text-[10px]"
                    />
                    {vendor.onboardingStatus === "ACTIVE" ? (
                      <Badge
                        className={
                          vendor.isOnDuty
                            ? "w-fit border-transparent bg-emerald-500/15 text-[10px] text-emerald-800 dark:text-emerald-300"
                            : "w-fit text-[10px]"
                        }
                        variant={vendor.isOnDuty ? "default" : "secondary"}
                      >
                        {vendor.isOnDuty ? "Online" : "Offline"}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell
                  className={`${PEOPLE_CELL} text-sm tabular-nums`}
                  title="Assigned / completed"
                >
                  {jobsLabel}
                </TableCell>
                <TableCell className={`${PEOPLE_CELL} text-sm text-muted-foreground`}>
                  <span className="block truncate">{formatJoinedDate(vendor.createdAt)}</span>
                </TableCell>
                <TableCell className={PEOPLE_ACTION_CELL}>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Actions for ${vendor.name}`}
                        />
                      }
                    >
                      <MoreHorizontalIcon />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onView?.(vendor)}>
                        <EyeIcon />
                        View
                      </DropdownMenuItem>
                      {vendor.onboardingStatus === "PENDING" ? (
                        <>
                          <DropdownMenuItem onClick={() => onApprove?.(vendor)}>
                            <CheckIcon />
                            Approve
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => onReject?.(vendor)}
                          >
                            <XIcon />
                            Reject
                          </DropdownMenuItem>
                        </>
                      ) : null}
                      {vendor.onboardingStatus === "ACTIVE" ? (
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onBlock?.(vendor)}
                        >
                          <BanIcon />
                          Block
                        </DropdownMenuItem>
                      ) : null}
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
