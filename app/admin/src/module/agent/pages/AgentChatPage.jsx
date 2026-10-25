import { useMemo } from "react"
import { Link } from "react-router-dom"
import { BotIcon } from "lucide-react"
import { AgentInterface, agUIAdapter, fetchLLM } from "@openuidev/react-ui"
import { API_URL } from "@/lib/env"
import { library } from "@/lib/openui"
import { sajawatOpenUiTheme } from "@/lib/openui-theme"
import { useAuthStore } from "@/store/auth.store"
import { useTheme } from "@/components/ui/theme-provider"
import { useAiPolicy } from "@/providers/ai-policy-provider"
import {
  getCatalogAiPolicyBlockReason,
  isCatalogAiReady,
} from "@/module/catalog/lib/catalog-ai-gate"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import { AnalyticsAssistantMessage } from "@/module/agent/components/AnalyticsAssistantMessage"

const llm = fetchLLM({
  url: `${API_URL}/admin/ai/analytics/chat`,
  streamAdapter: agUIAdapter(),
  fetch: (url, init) => {
    const token = useAuthStore.getState().accessToken
    const headers = new Headers(init?.headers)
    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }
    return fetch(url, { ...init, headers, credentials: "include" })
  },
})

const starters = [
  {
    displayText: "Orders last 7 days",
    prompt: "Show order count and GMV for the last 7 days, including a breakdown by status.",
  },
  {
    displayText: "Top products this month",
    prompt: "What are the top products by GMV so far this calendar month?",
  },
  {
    displayText: "Quiet repeat customers",
    prompt:
      "Find customers who placed at least two orders but have not ordered in the last 60 days. Use names only, no phone or email.",
  },
  {
    displayText: "Media images",
    prompt: "Show all media library images with filenames in a list.",
  },
]

const openUiTheme = {
  lightTheme: sajawatOpenUiTheme,
  darkTheme: sajawatOpenUiTheme,
  cssSelector: "[data-agent-chat]",
}

export function AgentChatPage() {
  const { policy, loading } = useAiPolicy()
  const { resolvedTheme } = useTheme()
  const blockReason = useMemo(() => getCatalogAiPolicyBlockReason(policy), [policy])
  const ready = isCatalogAiReady(policy)
  const mode = resolvedTheme === "light" ? "light" : "dark"

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center bg-background">
        <Spinner className="size-6" />
      </div>
    )
  }

  if (!ready) {
    return (
      <Empty className="h-full border-0 bg-background">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <BotIcon />
          </EmptyMedia>
          <EmptyTitle>Agent chat is off</EmptyTitle>
          <EmptyDescription>{blockReason}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link to="/settings">Open AI settings</Link>
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

  return (
    <div data-agent-chat className="agent-chat flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-background">
      <AgentInterface
        llm={llm}
        componentLibrary={library}
        components={{ AssistantMessage: AnalyticsAssistantMessage }}
        agentName="Analytics"
        starters={starters}
        starterVariant="short"
        theme={{ ...openUiTheme, mode }}
      >
        <AgentInterface.ThreadHeader showChatTitle={false} showChatActions={false} />
        <AgentInterface.Welcome
          title="Ask about orders and catalog"
          description="Try a starter or type a question, then send."
        />
        <AgentInterface.Composer placeholder="Ask anything..." />
      </AgentInterface>
    </div>
  )
}
