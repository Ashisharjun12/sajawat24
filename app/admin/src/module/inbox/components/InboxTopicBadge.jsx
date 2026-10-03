import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { conversationTopicBadge } from "@/module/inbox/lib/inbox-utils"

export function InboxTopicBadge({ item, className }) {
  const topic = conversationTopicBadge(item)
  if (!topic) return null

  return (
    <Badge className={cn("border-transparent text-[10px] font-medium", topic.className, className)}>
      {topic.label}
    </Badge>
  )
}
