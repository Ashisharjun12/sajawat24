import { CheckIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getCatalogAiRequirementChecks } from "@/module/catalog/lib/catalog-ai-gate"

export function ProductAiGenerateInfoContent({
  aiPolicy,
  name,
  parentCategoryId,
  categoryId,
  categoryName,
  loading,
}) {
  if (loading) {
    return "Loading AI settings…"
  }

  const checks = getCatalogAiRequirementChecks(aiPolicy, {
    name,
    parentCategoryId,
    categoryId,
    categoryName,
  })
  const pending = checks.filter((check) => !check.done)
  const ready = pending.length === 0
  const isPolicyBlock = checks.length === 1 && checks[0].kind === "policy"

  if (ready) {
    return "Ready. Generates SEO-friendly name, slug, description, includes, and FAQs. Review before save."
  }

  if (isPolicyBlock) {
    return checks[0].label
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="font-medium">Complete first:</p>
      <ul className="flex flex-col gap-1">
        {checks.map((check) => (
          <li key={check.label} className="flex items-start gap-2">
            {check.done ? (
              <CheckIcon className="mt-0.5 size-3.5 shrink-0 opacity-80" />
            ) : (
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-current opacity-60" />
            )}
            <span className={cn(!check.done && "font-medium")}>
              {check.label}
              {!check.done ? " *" : null}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
