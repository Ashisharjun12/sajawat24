import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { FolderIcon, LayoutGridIcon, TableIcon, UploadIcon } from "lucide-react"
import { createFolder, listFolders } from "@/api/folders.api"
import { ingestUpload, listUploads, mediaDisplayUrl, uploadMediaFile } from "@/api/uploads.api"
import { getApiError } from "@/api/api"
import { OPEN_FOLDER_IMAGE_URL } from "@/lib/media"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { UploadProgressList } from "@/module/media/components/UploadProgressList"

const PRODUCTS_NAME = "Products"
const PRODUCTS_SLUG = "products"
const FILE_LIMIT = 20
const FOLDER_LIMIT = 20
const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"

function asFolderList(data) {
  return Array.isArray(data) ? data : []
}

function itemKey(item) {
  return item.uploadId || item.id
}

function canSelect(item) {
  if (item.status && item.status !== "completed") return false
  if (item.optimizeStatus === "queued" || item.optimizeStatus === "failed") return false
  return true
}

function selectedFromAttached(attached) {
  const next = {}
  for (const item of attached || []) {
    const id = itemKey(item)
    if (id) next[id] = item
  }
  return next
}

async function ensureProductsFolder() {
  const roots = asFolderList(await listFolders({ parentId: "null" }))
  const existing = roots.find((folder) => folder.slug === PRODUCTS_SLUG)
  if (existing) return existing
  try {
    return await createFolder({ name: PRODUCTS_NAME })
  } catch (err) {
    if (err?.response?.status === 409) {
      const again = asFolderList(await listFolders({ parentId: "null" }))
      const found = again.find((folder) => folder.slug === PRODUCTS_SLUG)
      if (found) return found
    }
    throw err
  }
}

export function ProductMediaPickerDialog({
  open,
  onOpenChange,
  attached = [],
  onAdd,
  disabled,
  max = Number.POSITIVE_INFINITY,
  kinds = ["all", "image", "video"],
  resolveRootFolder = ensureProductsFolder,
  dialogTitle = "Select media",
  dialogDescription = "Upload to Media or pick existing files. New uploads go in the current folder (default Products).",
}) {
  const fileInputRef = useRef(null)
  const attachedRef = useRef(attached)
  attachedRef.current = attached
  const attachedIds = useMemo(
    () => new Set((attached || []).map(itemKey).filter(Boolean)),
    [attached],
  )

  const lockAttached = max > 1
  const accept =
    kinds.length === 1 && kinds[0] === "image"
      ? "image/jpeg,image/png,image/webp,image/gif"
      : kinds.length === 1 && kinds[0] === "video"
        ? "video/mp4,video/webm"
        : ACCEPT
  const [path, setPath] = useState([])
  const [folders, setFolders] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [folderPage, setFolderPage] = useState(1)
  const [q, setQ] = useState("")
  const [kind, setKind] = useState(kinds.includes("all") ? "all" : kinds[0] || "all")
  const [view, setView] = useState("grid")
  const [selected, setSelected] = useState({})
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState("")
  const [uploadQueue, setUploadQueue] = useState([])

  const folderId = path[path.length - 1]?.id ?? ""
  const inFolder = Boolean(folderId)
  const listQuery = inFolder ? q : ""
  const uploading = uploadQueue.some((row) => row.status === "uploading")
  const selectedCount = Object.keys(selected).length
  const newCount = Object.keys(selected).filter((id) => !attachedIds.has(id)).length

  const filteredFolders = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (inFolder || !term) return folders
    return folders.filter((folder) => folder.name.toLowerCase().includes(term))
  }, [folders, inFolder, q])

  const paginatedFolders = useMemo(() => {
    const start = (folderPage - 1) * FOLDER_LIMIT
    return filteredFolders.slice(start, start + FOLDER_LIMIT)
  }, [filteredFolders, folderPage])

  const loadFolders = useCallback(async (parentId) => {
    const data = await listFolders({ parentId: parentId ?? "null" })
    setFolders(asFolderList(data))
  }, [])

  const loadFiles = useCallback(async (id, filePage, query, fileKind) => {
    if (!id) {
      setItems([])
      setTotal(0)
      return
    }
    const data = await listUploads({
      page: filePage,
      limit: FILE_LIMIT,
      q: query.trim() || undefined,
      kind: fileKind === "all" ? undefined : fileKind,
      folderId: id,
      status: "completed",
    })
    setItems(data.items ?? [])
    setTotal(data.total ?? 0)
  }, [])

  useEffect(() => {
    if (!open) {
      setReady(false)
      return
    }
    let cancelled = false

    async function boot() {
      setError("")
      setReady(false)
      setLoading(true)
      setSelected(selectedFromAttached(attachedRef.current))
      setKind(kinds.includes("all") ? "all" : kinds[0] || "all")
      setView("grid")
      setQ("")
      setPage(1)
      setFolderPage(1)
      setUploadQueue([])
      setPath([])
      try {
        const folder = await resolveRootFolder()
        if (cancelled) return
        setPath([folder])
        setReady(true)
      } catch (err) {
        if (!cancelled) {
          setError(getApiError(err))
          setLoading(false)
        }
      }
    }

    boot()
    return () => {
      cancelled = true
    }
  }, [open, resolveRootFolder])

  useEffect(() => {
    if (!open || !ready) return
    let cancelled = false

    async function load() {
      setLoading(true)
      setError("")
      try {
        if (!folderId) {
          await loadFolders(null)
          if (!cancelled) {
            setItems([])
            setTotal(0)
          }
        } else {
          await Promise.all([
            loadFolders(folderId),
            loadFiles(folderId, page, listQuery, kind),
          ])
        }
      } catch (err) {
        if (!cancelled) setError(getApiError(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [open, ready, folderId, page, listQuery, kind, loadFolders, loadFiles])

  useEffect(() => {
    setFolderPage(1)
  }, [q, folderId])

  useEffect(() => {
    setPage(1)
  }, [kind, folderId, listQuery])

  function goRoot() {
    setPath([])
    setQ("")
    setPage(1)
    setFolderPage(1)
  }

  function goFolder(folder, index) {
    setPath((prev) => (typeof index === "number" ? prev.slice(0, index + 1) : [...prev, folder]))
    setQ("")
    setPage(1)
    setFolderPage(1)
  }

  function toggleFile(item) {
    if (!canSelect(item)) return
    if (lockAttached && attachedIds.has(item.id)) return
    setSelected((prev) => {
      if (max === 1) return { [item.id]: item }
      const next = { ...prev }
      if (next[item.id]) delete next[item.id]
      else next[item.id] = item
      return next
    })
  }

  async function onFiles(files) {
    if (!folderId || disabled) return
    setError("")
    let hadError = false
    const uploadedIds = []
    for (const file of files) {
      const queueId = `${Date.now()}-${file.name}-${Math.random()}`
      const isVideo = file.type.startsWith("video/")
      if (kinds.length === 1 && kinds[0] === "image" && isVideo) {
        setError(`${file.name} is not an image`)
        continue
      }
      if (kinds.length === 1 && kinds[0] === "video" && !isVideo) {
        setError(`${file.name} is not a video`)
        continue
      }
      setUploadQueue((prev) => [...prev, { id: queueId, name: file.name, percent: isVideo ? 0 : 40, status: "uploading" }])
      try {
        const uploaded = isVideo
          ? await uploadMediaFile(file, {
              folderId,
              onProgress: (percent) => {
                setUploadQueue((prev) =>
                  prev.map((row) => (row.id === queueId ? { ...row, percent } : row)),
                )
              },
            })
          : await ingestUpload(file, { folderId })
        uploadedIds.push(uploaded.id)
        setSelected((prev) => (max === 1 ? { [uploaded.id]: uploaded } : { ...prev, [uploaded.id]: uploaded }))
        setUploadQueue((prev) =>
          prev.map((row) => (row.id === queueId ? { ...row, percent: 100, status: "done" } : row)),
        )
      } catch (err) {
        hadError = true
        setUploadQueue((prev) =>
          prev.map((row) => (row.id === queueId ? { ...row, status: "error" } : row)),
        )
        setError(getApiError(err) || err.message || `Could not upload ${file.name}`)
      }
    }
    await loadFiles(folderId, page, listQuery, kind)
    setUploadQueue([])
    if (!hadError && uploadedIds.length) {
      setPage(1)
    }
  }

  function confirmAdd() {
    if (max === 1) {
      onAdd(Object.values(selected).slice(0, 1))
      onOpenChange(false)
      return
    }
    const additions = Object.values(selected).filter((item) => !attachedIds.has(itemKey(item)))
    onAdd(additions)
    onOpenChange(false)
  }

  const foldersEmpty = !inFolder && !loading && filteredFolders.length === 0
  const filesEmpty = inFolder && !loading && items.length === 0 && folders.length === 0
  const searchPlaceholder = inFolder ? "Search filename" : "Search folder name"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-4 overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="w-56"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
          {inFolder && kinds.length > 1 ? (
            <Tabs value={kind} onValueChange={setKind}>
              <TabsList>
                {kinds.map((value) => (
                  <TabsTrigger key={value} value={value}>
                    {value === "all" ? "All" : value === "image" ? "Images" : "Video"}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          ) : null}
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="table" aria-label="List view">
                <TableIcon />
              </TabsTrigger>
              <TabsTrigger value="grid" aria-label="Grid view">
                <LayoutGridIcon />
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Button
            type="button"
            className="ml-auto"
            disabled={!inFolder || uploading || disabled}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? <Spinner /> : <UploadIcon />}
            Upload
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            className="sr-only"
            accept={accept}
            multiple
            disabled={!inFolder || uploading || disabled}
            onChange={(event) => {
              onFiles(Array.from(event.target.files || []))
              event.target.value = ""
            }}
          />
        </div>

        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              {inFolder ? (
                <BreadcrumbLink
                  href="#"
                  onClick={(event) => {
                    event.preventDefault()
                    goRoot()
                  }}
                >
                  Media
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>Media</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            {path.map((folder, index) => (
              <span key={folder.id} className="contents">
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index === path.length - 1 ? (
                    <BreadcrumbPage>{folder.name}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink
                      href="#"
                      onClick={(event) => {
                        event.preventDefault()
                        goFolder(folder, index)
                      }}
                    >
                      {folder.name}
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </span>
            ))}
          </BreadcrumbList>
        </Breadcrumb>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">
          <UploadProgressList items={uploadQueue} />

          {loading && !items.length && !folders.length ? (
            view === "grid" ? <PickerGridSkeleton /> : <PickerTableSkeleton />
          ) : null}

          {foldersEmpty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>{q.trim() ? "No folders match" : "No folders yet"}</EmptyTitle>
                <EmptyDescription>
                  {q.trim() ? "Try a different folder name." : "The Products folder will appear here after it is created."}
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : null}

          {!loading && paginatedFolders.length ? (
            view === "table" ? (
              <FolderTable folders={paginatedFolders} onOpen={(folder) => goFolder(folder)} />
            ) : (
              <FolderGrid folders={paginatedFolders} onOpen={(folder) => goFolder(folder)} />
            )
          ) : null}

          {filteredFolders.length ? (
            <ListPagination
              page={folderPage}
              limit={FOLDER_LIMIT}
              total={filteredFolders.length}
              onPageChange={setFolderPage}
            />
          ) : null}

          {inFolder && paginatedFolders.length && items.length ? (
            <p className="mt-4 mb-2 text-sm font-medium">Files</p>
          ) : null}

          {inFolder && loading && items.length ? (
            view === "grid" ? <PickerGridSkeleton /> : <PickerTableSkeleton />
          ) : null}

          {filesEmpty ? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>{q.trim() || kind !== "all" ? "No files found" : "No files yet"}</EmptyTitle>
                <EmptyDescription>
                  {q.trim() || kind !== "all"
                    ? "Try a different filename or filter, or upload new media."
                    : "Upload images or videos to this folder, then select them."}
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button type="button" disabled={uploading || disabled} onClick={() => fileInputRef.current?.click()}>
                  <UploadIcon />
                  Upload
                </Button>
              </EmptyContent>
            </Empty>
          ) : null}

          {inFolder && !loading && items.length ? (
            view === "table" ? (
              <FileTable
                items={items}
                selected={selected}
                attachedIds={attachedIds}
                lockAttached={lockAttached}
                onToggle={toggleFile}
              />
            ) : (
              <FileGrid
                items={items}
                selected={selected}
                attachedIds={attachedIds}
                lockAttached={lockAttached}
                onToggle={toggleFile}
              />
            )
          ) : null}

          {inFolder && !loading && items.length ? (
            <div className="mt-3">
              <ListPagination page={page} limit={FILE_LIMIT} total={total} onPageChange={setPage} />
            </div>
          ) : null}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {selectedCount ? `${selectedCount} selected` : "Select files to add"}
            {newCount ? ` · ${newCount} new` : ""}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" disabled={selectedCount === 0 || disabled} onClick={confirmAdd}>
              {max === 1 ? "Use selected" : "Add"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FolderGrid({ folders, onOpen }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {folders.map((folder) => (
        <button
          key={folder.id}
          type="button"
          className="flex cursor-pointer flex-col items-start gap-2 rounded-2xl border bg-card p-3 text-left shadow-sm transition-colors hover:bg-muted/40"
          onClick={() => onOpen(folder)}
        >
          <img src={OPEN_FOLDER_IMAGE_URL} alt="" className="size-10 object-contain" />
          <span className="truncate font-medium">{folder.name}</span>
          <span className="text-xs text-muted-foreground">Open folder</span>
        </button>
      ))}
    </div>
  )
}

function FolderTable({ folders, onOpen }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12" />
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {folders.map((folder) => (
          <TableRow
            key={folder.id}
            className="cursor-pointer"
            onClick={() => onOpen(folder)}
          >
            <TableCell>
              <FolderIcon className="size-4 text-muted-foreground" />
            </TableCell>
            <TableCell className="font-medium">{folder.name}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

function FileGrid({ items, selected, attachedIds, lockAttached, onToggle }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {items.map((item) => {
        const checked = Boolean(selected[item.id])
        const attached = lockAttached && attachedIds.has(item.id)
        const enabled = canSelect(item)
        const src = item.optimizedUrl || mediaDisplayUrl(item)
        return (
          <div
            key={item.id}
            role="button"
            tabIndex={enabled && !attached ? 0 : -1}
            onClick={() => onToggle(item)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault()
                onToggle(item)
              }
            }}
            className={cn(
              "relative overflow-hidden rounded-2xl border bg-card text-left shadow-sm transition-colors",
              checked ? "ring-2 ring-primary" : "",
              enabled && !attached ? "cursor-pointer hover:bg-muted/40" : "cursor-default",
            )}
          >
            <span className="absolute top-2 left-2 z-10" onClick={(event) => event.stopPropagation()}>
              <Checkbox
                checked={checked}
                disabled={!enabled || attached}
                onCheckedChange={() => onToggle(item)}
                aria-label={`Select ${item.filename}`}
              />
            </span>
            <span className="block aspect-square w-full bg-muted">
              {item.kind === "video" ? (
                <video src={src} className="size-full object-cover" muted playsInline />
              ) : (
                <img src={src} alt={item.filename} className="size-full object-cover" />
              )}
            </span>
            <span className="flex items-center justify-between gap-2 p-3">
              <span className="truncate text-sm font-medium" title={item.filename}>
                {item.filename}
              </span>
              <Badge variant="secondary" className="capitalize">
                {item.kind}
              </Badge>
            </span>
            {attached ? (
              <Badge className="absolute top-2 right-2">On product</Badge>
            ) : null}
            {!enabled ? (
              <Badge variant="secondary" className="absolute top-2 right-2">
                {item.optimizeStatus === "queued" ? "Optimizing" : "Unavailable"}
              </Badge>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}

function FileTable({ items, selected, attachedIds, lockAttached, onToggle }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-10" />
          <TableHead className="w-14">Preview</TableHead>
          <TableHead>Filename</TableHead>
          <TableHead>Kind</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const checked = Boolean(selected[item.id])
          const attached = lockAttached && attachedIds.has(item.id)
          const enabled = canSelect(item)
          const src = item.optimizedUrl || mediaDisplayUrl(item)
          return (
            <TableRow
              key={item.id}
              className={enabled && !attached ? "cursor-pointer" : ""}
              data-state={checked ? "selected" : undefined}
              onClick={() => onToggle(item)}
            >
              <TableCell onClick={(event) => event.stopPropagation()}>
                <Checkbox
                  checked={checked}
                  disabled={!enabled || attached}
                  onCheckedChange={() => onToggle(item)}
                  aria-label={`Select ${item.filename}`}
                />
              </TableCell>
              <TableCell>
                <div className="size-10 overflow-hidden rounded-lg bg-muted">
                  {item.kind === "video" ? (
                    <video src={src} className="size-full object-cover" muted playsInline />
                  ) : (
                    <img src={src} alt="" className="size-full object-cover" />
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-48 truncate font-medium" title={item.filename}>
                {item.filename}
              </TableCell>
              <TableCell className="capitalize">{item.kind}</TableCell>
              <TableCell className="text-muted-foreground">
                {attached
                  ? "On product"
                  : !enabled
                    ? item.optimizeStatus === "queued"
                      ? "Optimizing"
                      : "Unavailable"
                    : "Ready"}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

function PickerGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-square w-full" />
      ))}
    </div>
  )
}

function PickerTableSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  )
}
