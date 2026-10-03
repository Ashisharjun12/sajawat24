import { useEffect, useState } from "react"
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
import { CmsFormDialogShell } from "@/module/cms/components/CmsFormDialogShell"
import { PlatformCheckboxes } from "@/module/cms/components/PlatformCheckboxes"
import { CMS_STATUSES, websitePlatformsOnly } from "@/module/cms/lib/cms-constants"

const FORM_ID = "faq-form"

export function FaqFormDialog({ open, onOpenChange, item, onSubmit, submitting }) {
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const [status, setStatus] = useState("draft")
  const [platforms, setPlatforms] = useState(["web", "mobile"])

  useEffect(() => {
    if (!open) return
    setQuestion(item?.question ?? "")
    setAnswer(item?.answer ?? "")
    setStatus(item?.status ?? "draft")
    setPlatforms(websitePlatformsOnly(item?.platforms))
  }, [open, item])

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
          <Button type="submit" form={FORM_ID} disabled={submitting}>
            {submitting ? <Spinner className="size-4" /> : null}
            Save
          </Button>
        </>
      }
    >
      <form id={FORM_ID} className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="flex flex-col gap-2">
          <Label htmlFor="faq-question">Question</Label>
          <Input
            id="faq-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            maxLength={500}
            required
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
