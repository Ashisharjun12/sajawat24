import { Button } from "@/components/ui/button"

export function ListPagination({ page, limit, total, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil((total || 0) / (limit || 20)))
  if (pageCount <= 1) return null

  return (
    <div className="flex items-center justify-end gap-2">
      <p className="mr-auto text-sm text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        Previous
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        Next
      </Button>
    </div>
  )
}
