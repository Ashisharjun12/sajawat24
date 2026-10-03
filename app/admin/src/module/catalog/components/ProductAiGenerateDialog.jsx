import { useEffect, useRef, useState } from "react"
import { SparklesIcon } from "lucide-react"
import { generateProductCopy } from "@/api/ai.api"
import { getApiError } from "@/api/api"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { InputGroup, InputGroupTextarea } from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"
import { AdminInfoTip } from "@/components/admin-info-tip"

const AI_GENERATE_DIALOG_INFO =
  "Drafts SEO copy for this product and category. Always review before applying."

function errorMessage(err) {
  const message = getApiError(err)
  if (message.includes("403") || message.toLowerCase().includes("disabled")) {
    return "AI is disabled. Turn it on in Settings → AI."
  }
  if (message.includes("429") || message.toLowerCase().includes("rate limit")) {
    return "AI rate limit reached. Try again later."
  }
  if (message.includes("504") || message.toLowerCase().includes("timed out")) {
    return "AI request timed out. Try again with shorter notes."
  }
  if (message.includes("503") || message.toLowerCase().includes("unavailable")) {
    return "AI service is temporarily unavailable."
  }
  return message
}

export function ProductAiGenerateDialog({
  open,
  onOpenChange,
  name,
  categoryName,
  parentCategoryName,
  currentSlug,
  onApply,
}) {
  const [tone, setTone] = useState("professional")
  const [notes, setNotes] = useState("")
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)
  const [slugConfirmOpen, setSlugConfirmOpen] = useState(false)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort()
      abortRef.current = null
      setLoading(false)
      setPreview(null)
      setNotes("")
      setTone("professional")
    }
  }, [open])

  async function runGenerate() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setLoading(true)
    setPreview(null)
    try {
      const data = await generateProductCopy({
        name,
        categoryName,
        parentCategoryName: parentCategoryName || undefined,
        notes: notes.trim() || undefined,
        tone,
      })
      if (!controller.signal.aborted) {
        setPreview(data)
      }
    } catch (err) {
      if (!controller.signal.aborted) {
        toast.add({ title: errorMessage(err), type: "error" })
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false)
      }
    }
  }

  function requestApply() {
    if (!preview) return
    if (currentSlug?.trim() && preview.slug && currentSlug.trim() !== preview.slug) {
      setSlugConfirmOpen(true)
      return
    }
    onApply(preview)
    onOpenChange(false)
  }

  function confirmApply() {
    if (!preview) return
    onApply(preview)
    setSlugConfirmOpen(false)
    onOpenChange(false)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-0.5">
              Generate with AI
              <AdminInfoTip content={AI_GENERATE_DIALOG_INFO} side="bottom" align="start" />
            </DialogTitle>
            <DialogDescription>
              For <span className="font-medium text-foreground">{name}</span>
              {categoryName ? ` · ${categoryName}` : ""}
            </DialogDescription>
          </DialogHeader>

          <FieldGroup>
            <Field>
              <FieldLabel>Tone</FieldLabel>
              <Select value={tone} onValueChange={setTone} disabled={loading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Extra notes (optional)</FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Theme, age group, premium feel, indoor setup..."
                  disabled={loading}
                />
              </InputGroup>
            </Field>
          </FieldGroup>

          {loading ? (
            <div className="flex flex-col gap-3 py-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                Generating SEO-friendly product copy…
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : null}

          {preview ? (
            <div className="flex flex-col gap-4 rounded-lg border border-border p-4 text-sm">
              <div>
                <p className="font-medium text-foreground">Slug</p>
                <p className="mt-1 font-mono text-muted-foreground">{preview.slug}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Description</p>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">{preview.description}</p>
              </div>
              <PreviewList title="What's included" items={preview.includes} />
              <PreviewList title="Delivery and setup" items={preview.deliverySetup} />
              <PreviewList title="Care instructions" items={preview.careInstructions} />
              {preview.faqs?.length ? (
                <div>
                  <p className="font-medium text-foreground">FAQs</p>
                  <ul className="mt-2 flex flex-col gap-2">
                    {preview.faqs.map((faq, index) => (
                      <li key={index} className="rounded-md bg-muted/40 p-2">
                        <p className="font-medium">{faq.question}</p>
                        <p className="mt-1 text-muted-foreground">{faq.answer}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            {preview ? (
              <Button type="button" variant="outline" onClick={runGenerate} disabled={loading}>
                Regenerate
              </Button>
            ) : null}
            {!preview ? (
              <Button type="button" onClick={runGenerate} disabled={loading}>
                <SparklesIcon />
                Generate
              </Button>
            ) : (
              <Button type="button" onClick={requestApply} disabled={loading}>
                Apply to form
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={slugConfirmOpen} onOpenChange={setSlugConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing slug?</AlertDialogTitle>
            <AlertDialogDescription>
              The form already has slug &quot;{currentSlug}&quot;. Apply the AI suggestion &quot;
              {preview?.slug}&quot; instead?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep current</AlertDialogCancel>
            <AlertDialogAction onClick={confirmApply}>Replace slug</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

function PreviewList({ title, items }) {
  if (!items?.length) return null
  return (
    <div>
      <p className="font-medium text-foreground">{title}</p>
      <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  )
}
