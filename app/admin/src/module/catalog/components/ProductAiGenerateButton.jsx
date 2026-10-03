import { SparklesIcon } from "lucide-react"
import { AdminInfoTip } from "@/components/admin-info-tip"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getCatalogAiRequirementChecks } from "@/module/catalog/lib/catalog-ai-gate"
import { ProductAiGenerateInfoContent } from "@/module/catalog/components/ProductAiGenerateInfoContent"

export function ProductAiGenerateButton({
  aiPolicy,
  name,
  parentCategoryId,
  categoryId,
  categoryName,
  loading = false,
  submitting = false,
  onClick,
}) {
  const checks = getCatalogAiRequirementChecks(aiPolicy, {
    name,
    parentCategoryId,
    categoryId,
    categoryName,
  })
  const pending = checks.filter((check) => !check.done)
  const ready = pending.length === 0 && !loading
  const disabled = !ready || submitting

  return (
    <div className="flex items-center gap-0.5">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          ready &&
            "border-emerald-500/40 text-emerald-700 hover:bg-emerald-500/10 hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200",
        )}
      >
        <SparklesIcon />
        Generate with AI
      </Button>
      <AdminInfoTip
        side="bottom"
        align="end"
        contentClassName="max-w-sm"
        content={
          <ProductAiGenerateInfoContent
            aiPolicy={aiPolicy}
            name={name}
            parentCategoryId={parentCategoryId}
            categoryId={categoryId}
            categoryName={categoryName}
            loading={loading}
          />
        }
      />
    </div>
  )
}
