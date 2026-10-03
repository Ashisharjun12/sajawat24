import { useCallback, useEffect, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { BrandPageCreateDialog } from "@/module/brand/components/BrandPageCreateDialog"
import { FileTextIcon, PlusIcon } from "lucide-react"
import { getApiError } from "@/api/api"
import { deleteBrandPage, listBrandPages } from "@/api/brand.api"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "@/components/ui/toast"
import { CmsDeleteDialog } from "@/module/cms/components/CmsDeleteDialog"
import { CmsEmptyState } from "@/module/cms/components/CmsEmptyState"

export function BrandPagesPanel() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [deleting, setDeleting] = useState(null)
  const [deletingBusy, setDeletingBusy] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError("")
    try {
      const data = await listBrandPages({ limit: 200 })
      setItems(data.items ?? [])
    } catch (err) {
      setItems([])
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  async function confirmDelete() {
    if (!deleting) return
    setDeletingBusy(true)
    try {
      await deleteBrandPage(deleting.id)
      toast.add({ title: "Page deleted", type: "success" })
      setDeleting(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setDeletingBusy(false)
    }
  }

  const empty = !loading && !error && items.length === 0

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Create a page, then edit content on the next screen. Public URLs are{" "}
        <code className="text-xs">/pages/your-slug</code>.
      </p>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {!empty ? (
        <div className="flex justify-end">
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <PlusIcon />
            Add page
          </Button>
        </div>
      ) : null}
      {empty ? (
        <CmsEmptyState
          icon={FileTextIcon}
          title="No pages"
          description="Create privacy policy, terms, refunds, and other footer-linked content."
          actionLabel="Add page"
          onAction={() => setCreateOpen(true)}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((row) => (
              <TableRow key={row.id}>
                <TableCell className="font-medium">{row.title}</TableCell>
                <TableCell className="text-muted-foreground">/pages/{row.slug}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell className="text-right">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <Link to={`/brand/pages/${row.id}`}>Edit</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-destructive"
                    onClick={() => setDeleting(row)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <BrandPageCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(page) => {
          void load()
          if (page?.id) navigate(`/brand/pages/${page.id}`)
        }}
      />
      <CmsDeleteDialog
        open={Boolean(deleting)}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete page?"
        description="This cannot be undone. Pages linked in the footer must be unlinked first."
        onConfirm={confirmDelete}
        confirming={deletingBusy}
      />
    </div>
  )
}
