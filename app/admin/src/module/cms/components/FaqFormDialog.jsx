import { useEffect, useState } from "react"
import { SparklesIcon } from "lucide-react"
import { suggestCmsFaq } from "@/api/ai.api"
import { getApiError } from "@/api/api"
import { useAiPolicy } from "@/providers/ai-policy-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"
import { getFaqAiGenerateBlockReason } from "@/module/cms/lib/faq-ai-gate"

const FORM_ID = "faq-form"

function aiErrorMessage(err) {
  const message = getApiError(err)
  if (message.includes("504") || message.toLowerCase().includes("timed out")) {
    return "AI request timed out. Try a shorter topic or try again."
  }
  if (message.includes("503") || message.toLowerCase().includes("unavailable")) {
    return "AI service is temporarily unavailable."
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached. Try again later."
  }
  return message
}

export function FaqFormDialog({ open, onOpenChange, item, onSubmit, submitting }) {
  const { policy: aiPolicy } = useAiPolicy()
  const [topic, setTopic] = useState("")
  const [tone, setTone] = useState("professional")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState("draft")
  const [platforms, setPlatforms] = useState(["web", "mobile"])
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTopic("")
    setTone("professional")
    setQuestion(item?.question ?? "")
    setAnswer(item?.answer ?? "")
    setStatus(item?.status ?? "draft")
    setPlatforms(websitePlatformsOnly(item?.platforms))
    setAiLoading(false)
  }, [open, item])

  const aiBlockReason = getFaqAiGenerateBlockReason(aiPolicy, {
    topic,
    question,
  })

  async function handleSuggestAi() {
    if (aiBlockReason) {
      toast.add({ title: aiBlockReason, type: "error" })
      return
    }
    const topicValue = topic.trim() || question.trim().slice(0, 200)
    setAiLoading(true)
    try {
      const data = await suggestCmsFaq({
        topic: topicValue,
        question: question.trim() || undefined,
        tone,
      })
      if (data?.question) setQuestion(data.question)
      if (data?.answer) setAnswer(data.answer)
      toast.add({ title: "FAQ draft ready — review before saving", type: "success" })
    } catch (err) {
      toast.add({ title: aiErrorMessage(err), type: "error" })
    } finally {
      setAiLoading(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    onSubmit?.({
      question,
      answer,
      status,
      platforms,
    })
  }

  return (
    <CmsFormDialogShell
      open={open}
      onOpenChange={onOpenChange}
      title={item ? "Edit FAQ" : "Add FAQ"}
      footer={
        <>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" form={FORM_ID} disabled={submitting || aiLoading}>
            {submitting ? <Spinner className="size-4" /> : null}
            Save
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border/80 bg-muted/30 p-3">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div className="min-w-0 flex-1 space-y-2">
              <Label htmlFor="faq-ai-topic">AI topic (optional)</Label>
              <Input
                id="faq-ai-topic"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                maxLength={200}
                placeholder="e.g. home birthday decoration booking"
                disabled={aiLoading}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={Boolean(aiBlockReason) || aiLoading || submitting}
              onClick={() => void handleSuggestAi()}
              className="shrink-0"
            >
              {aiLoading ? <Spinner className="size-4" /> : <SparklesIcon className="size-4" />}
              Draft with AI
            </Button>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Label className="text-muted-foreground text-xs sm:w-24">AI tone</Label>
            <Select value={tone} onValueChange={setTone} disabled={aiLoading}>
              <SelectTrigger className="sm:max-w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="friendly">Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {aiBlockReason ? (
            <p className="text-muted-foreground text-xs">{aiBlockReason}</p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="faq-question">Question</Label>
          <Input
            id="faq-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            required
            disabled={aiLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="faq-answer">Answer</Label>
          <Textarea
            id="faq-answer"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            rows={5}
            maxLength={5000}
            required
            disabled={aiLoading}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {CMS_STATUSES.map((value) => (
                <SelectItem key={value} value={value}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <PlatformCheckboxes value={platforms} onChange={setPlatforms} />
      </form>
    </CmsFormDialogShell>
  )
}
