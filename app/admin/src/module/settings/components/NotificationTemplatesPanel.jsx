import { useEffect, useState } from "react"
import { getApiError } from "@/api/api"
import {
  createNotificationTemplateVersion,
  listNotificationTemplates,
  patchNotificationTemplate,
} from "@/api/settings.api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/toast"

export function NotificationTemplatesPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [saving, setSaving] = useState(false)

  async function load() {
    const data = await listNotificationTemplates()
    setItems(data?.items ?? [])
  }

  useEffect(() => {
    let cancelled = false
    listNotificationTemplates()
      .then((data) => {
        if (!cancelled) setItems(data?.items ?? [])
      })
      .catch((err) => {
        if (!cancelled) toast.add({ title: getApiError(err), type: "error" })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  function openEdit(row) {
    setEditing(row)
    setName(row.name ?? "")
    setSubject(row.activeVersion?.subject ?? "")
    setContent(row.activeVersion?.content ?? "")
  }

  async function onToggleActive(row, isActive) {
    try {
      await patchNotificationTemplate(row.id, { isActive })
      toast.add({ title: isActive ? "Template enabled" : "Template disabled", type: "success" })
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    }
  }

  async function onSave() {
    if (!editing) return
    setSaving(true)
    try {
      if (name.trim() !== editing.name) {
        await patchNotificationTemplate(editing.id, { name: name.trim() })
      }
      if (editing.editable) {
        await createNotificationTemplateVersion(editing.id, {
          subject: subject.trim() || null,
          content: content.trim(),
          variables: editing.activeVersion?.variables ?? [],
        })
      }
      toast.add({ title: "Template saved", type: "success" })
      setEditing(null)
      await load()
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Templates</CardTitle>
        <CardDescription>
          Copy and versions per channel. Login OTP is locked so auth cannot be broken from admin.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-muted-foreground py-6 text-sm">No templates yet.</p>
        ) : (
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Key</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-mono text-xs">{row.key}</TableCell>
                  <TableCell className="font-medium">{row.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{row.type}</Badge>
                  </TableCell>
                  <TableCell>{row.channel}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {row.activeVersion?.version ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={Boolean(row.isActive)}
                      onCheckedChange={(checked) => onToggleActive(row, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="outline" size="sm" onClick={() => openEdit(row)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing?.name}</DialogTitle>
            <DialogDescription>
              {editing?.editable
                ? "Saving copy creates a new active version."
                : "This template is locked. You can rename it only."}
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            {editing?.channel === "email" || editing?.channel === "push" ? (
              <Field>
                <FieldLabel>Subject</FieldLabel>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!editing?.editable}
                />
              </Field>
            ) : null}
            <Field>
              <FieldLabel>Content</FieldLabel>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={!editing?.editable}
                className="min-h-32"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={onSave} disabled={saving}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
