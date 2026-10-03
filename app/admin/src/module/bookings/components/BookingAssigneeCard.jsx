import { Link } from "react-router-dom"
import { MapPinIcon, PhoneIcon, UserPlusIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

function vendorInitial(name) {
  const text = String(name ?? "").trim()
  return text ? text.charAt(0).toUpperCase() : "?"
}

function assigneeBadge(vendorResponse) {
  switch (vendorResponse) {
    case "pending":
      return (
        <Badge className="border-transparent bg-amber-500/15 text-amber-800 dark:text-amber-300">
          Pending acceptance
        </Badge>
      )
    case "accepted":
      return (
        <Badge className="border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
          Accepted
        </Badge>
      )
    case "declined":
      return (
        <Badge className="border-transparent bg-red-500/15 text-red-800 dark:text-red-300">
          Declined
        </Badge>
      )
    default:
      return (
        <Badge className="border-transparent bg-emerald-500/15 text-emerald-800 dark:text-emerald-300">
          Assigned
        </Badge>
      )
  }
}

export function BookingAssigneeCard({ assignee, cityName, canAssign, onAssign }) {
  const isDeclined = assignee?.vendorResponse === "declined"
  const hasActiveAssignee = assignee && !isDeclined

  return (
    <Card
      className={
        hasActiveAssignee
          ? "h-full border-primary/20 bg-primary/5"
          : "h-full"
      }
    >
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <CardTitle className="text-base">Assigned decorator</CardTitle>
          <CardDescription>
            {hasActiveAssignee
              ? assignee.vendorResponse === "pending"
                ? "Waiting for the vendor to accept this job."
                : "Vendor responsible for this booking."
              : isDeclined
                ? `${assignee.name} declined this booking.`
                : "No vendor assigned yet."}
          </CardDescription>
        </div>
        {hasActiveAssignee && canAssign ? (
          <Button type="button" variant="ghost" size="sm" onClick={onAssign}>
            Change
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        {hasActiveAssignee || isDeclined ? (
          <div className="flex items-start gap-4">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/10 font-medium text-primary">
                {vendorInitial(assignee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/people/vendors/${assignee.id}`}
                  className="font-medium hover:text-primary hover:underline"
                >
                  {assignee.name}
                </Link>
                {assigneeBadge(assignee.vendorResponse)}
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <PhoneIcon className="size-3.5 shrink-0" />
                <span>{assignee.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPinIcon className="size-3.5 shrink-0" />
                <span>
                  {assignee.cityName} · PIN {assignee.pincode}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <Empty className="border-0 p-4">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <UserPlusIcon />
              </EmptyMedia>
              <EmptyTitle>No decorator assigned</EmptyTitle>
              <EmptyDescription>
                {canAssign
                  ? `Pick an active decorator in ${cityName || "this city"}.`
                  : "Assignment is not available for this booking status."}
              </EmptyDescription>
            </EmptyHeader>
            {canAssign ? (
              <EmptyContent>
                <Button type="button" onClick={onAssign}>
                  <UserPlusIcon className="size-4" />
                  Assign vendor
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
        {isDeclined && canAssign ? (
          <Button type="button" className="mt-4 w-full" onClick={onAssign}>
            Assign another vendor
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
