import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from "@/lib/utils"

export function MessageServiceSmsPanel({ items }) {
  const rows = items ?? []

  if (rows.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">No SMS templates in catalog.</p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {rows.map((row) => (
        <Card key={row.templateKey}>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle className="text-base">{row.templateKey}</CardTitle>
                <CardDescription className="mt-1">{row.adminDescription}</CardDescription>
              </div>
              <Badge variant="secondary">DLT SMS</Badge>
            </div>
            <p className="text-muted-foreground text-xs">
              Events: {row.events.join(", ")} · Env:{" "}
              <code className="text-foreground">{row.msg91TemplateEnvKey}</code>
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <p className="text-sm">
              <span className="font-medium">Variables:</span>{" "}
              {row.variables.map((v) => `{{${v}}}`).join(", ")}
            </p>
            <p className="text-muted-foreground text-sm">{row.enableSmsNote}</p>
            <Collapsible>
              <CollapsibleTrigger
                type="button"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Suggested DLT / SMS text
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3">
                <CopyBlock text={row.smsSuggestedText} />
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function CopyBlock({ text }) {
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="relative">
      <pre className="bg-muted max-h-48 overflow-auto rounded-md border p-3 text-xs whitespace-pre-wrap">
        {text}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2"
        onClick={copy}
      >
        Copy
      </Button>
    </div>
  )
}
