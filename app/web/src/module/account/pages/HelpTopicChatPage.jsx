import { useParams } from "react-router-dom"
import { AccountChatPanel } from "@/module/chat/components/AccountChatPanel"
import { ChatThreadView } from "@/module/chat/components/ChatThreadView"
import { useSupportTopicChatThread } from "@/module/chat/hooks/use-support-topic-chat-thread"
import { getHelpTopic } from "@/module/chat/lib/help-topics"

export function HelpTopicChatPage() {
  const { topicKey } = useParams()
  const topic = getHelpTopic(topicKey)
  const thread = useSupportTopicChatThread(topicKey, topic?.title)

  return (
    <AccountChatPanel
      backTo="/account/help"
      title={topic?.title ?? "Help & Support"}
      subtitle={topic?.description}
    >
      <ChatThreadView {...thread} ownRole="customer" placeholder="Tell us how we can help..." />
    </AccountChatPanel>
  )
}
