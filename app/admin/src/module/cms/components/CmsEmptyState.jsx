import { PlusIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export function CmsEmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icon />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {onAction ? (
        <Button type="button" onClick={onAction}>
          <PlusIcon />
          {actionLabel}
        </Button>
      ) : null}
    </Empty>
  )
}
