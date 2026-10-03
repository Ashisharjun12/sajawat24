import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  FolderPlusIcon,
  LayoutGridIcon,
  MoreHorizontalIcon,
  PencilIcon,
  TableIcon,
  Trash2Icon,
  UploadIcon,
} from "lucide-react"
import { createFolder, deleteFolder, listFolders, patchFolder } from "@/api/folders.api"
import {
  deleteUpload,
  listUploads,
  patchUpload,
  uploadMediaFile,
  waitForOptimize,
} from "@/api/uploads.api"
import { getApiError } from "@/api/api"
import { toast } from "@/components/ui/toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { OPEN_FOLDER_IMAGE_URL } from "@/lib/media"
import { ListPagination } from "@/module/geo/components/ListPagination"
import { MediaCropDialog } from "@/module/media/components/MediaCropDialog"
import { FolderFormDialog } from "@/module/media/components/FolderFormDialog"
import { FilenameFormDialog } from "@/module/media/components/FilenameFormDialog"
import { MediaFilesTable } from "@/module/media/components/MediaFilesTable"
import { MediaGrid } from "@/module/media/components/MediaGrid"
import { UploadProgressList } from "@/module/media/components/UploadProgressList"

const LIMIT = 20
const FOLDER_LIMIT = 20

function findFolder(tree, id) {
  return (tree || []).find((folder) => folder.id === id)
}

export function MediaPage() {
  const [params, setParams] = useSearchParams()
  const folderId = params.get("folder") || ""
  const mediaFilter =
    params.get("filter") === "raw" ||
    params.get("filter") === "optimized" ||
    params.get("filter") === "video"
      ? params.get("filter")
      : "all"
  const view = params.get("view") === "table" ? "table" : "grid"
  const [page, setPage] = useState(1)
  const [folderPage, setFolderPage] = useState(1)
  const [q, setQ] = useState("")
  const [folderQ, setFolderQ] = useState("")
  const [tree, setTree] = useState([])
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [uploadQueue, setUploadQueue] = useState([])
  const [folderOpen, setFolderOpen] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [folderSubmitting, setFolderSubmitting] = useState(false)
  const [folderError, setFolderError] = useState("")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [cropItem, setCropItem] = useState(null)
  const [cropSubmitting, setCropSubmitting] = useState(false)
  const [renameItem, setRenameItem] = useState(null)
  const [renameSubmitting, setRenameSubmitting] = useState(false)
  const [renameError, setRenameError] = useState("")
  const fileInputRef = useRef(null)

  const uploading = uploadQueue.some((row) => row.status === "uploading")
  const current = findFolder(tree, folderId)
  const inFolder = Boolean(folderId)
  const folderFiltered = Boolean(folderQ.trim())

  const paginatedFolders = useMemo(() => {
    const start = (folderPage - 1) * FOLDER_LIMIT
    return tree.slice(start, start + FOLDER_LIMIT)
  }, [tree, folderPage])

  const loadTree = useCallback(async () => {
    const data = await listFolders(inFolder ? {} : { q: folderQ.trim() || undefined })
    setTree(Array.isArray(data) ? data : [])
  }, [folderQ, inFolder])

  const loadFiles = useCallback(async () => {
    if (!inFolder) {
      setItems([])
      setTotal(0)
      setLoading(false)
      return
    }
    setLoading(true)
    setError("")
    try {
      const kind =
        mediaFilter === "video" ? "video" : mediaFilter === "raw" || mediaFilter === "optimized" ? "image" : undefined
      const optimizeStatus =
        mediaFilter === "raw" ? "none" : mediaFilter === "optimized" ? "completed" : undefined
      const data = await listUploads({
        page,
        limit: LIMIT,
        q: q.trim() || undefined,
        kind,
        folderId,
        status: "completed",
        optimizeStatus,
      })
      setItems(data.items ?? [])
      setTotal(data.total ?? 0)
    } catch (err) {
      setError(getApiError(err))
    } finally {
      setLoading(false)
    }
  }, [page, q, mediaFilter, folderId, inFolder])

  useEffect(() => {
    loadTree().catch((err) => setError(getApiError(err)))
  }, [loadTree])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  useEffect(() => {
    setFolderPage(1)
  }, [folderQ])

  function setFolder(id) {
    setPage(1)
    setQ("")
    const next = new URLSearchParams(params)
    if (id) next.set("folder", id)
    else {
      next.delete("folder")
      next.delete("filter")
      next.delete("view")
    }
    setParams(next, { replace: true })
  }

  function setMediaFilter(nextFilter) {
    setPage(1)
    const next = new URLSearchParams(params)
    if (nextFilter && nextFilter !== "all") next.set("filter", nextFilter)
    else next.delete("filter")
    setParams(next, { replace: true })
  }

  function setView(nextView) {
    setPage(1)
    const next = new URLSearchParams(params)
    if (nextView === "table") next.set("view", "table")
    else next.delete("view")
    setParams(next, { replace: true })
  }

  function openCreateFolder() {
    setEditingFolder(null)
    setFolderError("")
    setFolderOpen(true)
  }

  function openEditFolder(folder) {
    setEditingFolder(folder)
    setFolderError("")
    setFolderOpen(true)
  }

  async function onFolderSubmit(values) {
    setFolderSubmitting(true)
    setFolderError("")
    try {
      if (editingFolder) {
        await patchFolder(editingFolder.id, { name: values.name })
        toast.add({ title: "Folder updated", type: "success" })
      } else {
        await createFolder({ name: values.name, parentId: null })
        toast.add({ title: "Folder created", type: "success" })
      }
      setFolderOpen(false)
      await loadTree()
    } catch (err) {
      setFolderError(getApiError(err))
    } finally {
      setFolderSubmitting(false)
    }
  }

  async function onRenameSubmit(values) {
    if (!renameItem) return
    setRenameSubmitting(true)
    setRenameError("")
    try {
      const next = await patchUpload(renameItem.id, { filename: values.filename })
      setItems((prev) => prev.map((row) => (row.id === renameItem.id ? { ...row, ...next } : row)))
      toast.add({ title: "Filename updated", type: "success" })
      setRenameItem(null)
      setRenameError("")
    } catch (err) {
      setRenameError(getApiError(err))
    } finally {
      setRenameSubmitting(false)
    }
  }

  async function confirmDelete() {
    if (!deleteTarget) return
    try {
      if (deleteTarget.type === "folder") {
        await deleteFolder(deleteTarget.id)
        toast.add({ title: "Folder deleted", type: "success" })
        if (folderId === deleteTarget.id) setFolder("")
        await loadTree()
      } else {
        await deleteUpload(deleteTarget.id)
        toast.add({ title: "File deleted", type: "success" })
        await loadFiles()
      }
    } catch (err) {
      toast.add({ title: getApiError(err), type: "error" })
    } finally {
      setDeleteTarget(null)
    }
  }

  async function onFiles(files) {
    setError("")
    let hadError = false
    for (const file of files) {
      const queueId = `${Date.now()}-${file.name}-${Math.random()}`
      setUploadQueue((prev) => [...prev, { id: queueId, name: file.name, percent: 0, status: "uploading" }])
      try {
        await uploadMediaFile(file, {
          folderId,
          onProgress: (percent) => {
            setUploadQueue((prev) =>
              prev.map((row) => (row.id === queueId ? { ...row, percent } : row)),
            )
          },
        })
        setUploadQueue((prev) =>
          prev.map((row) => (row.id === queueId ? { ...row, percent: 100, status: "done" } : row)),
        )
      } catch (err) {
        hadError = true
        setUploadQueue((prev) =>
          prev.map((row) => (row.id === queueId ? { ...row, status: "error" } : row)),
        )
        setError(getApiError(err) || err.message)
      }
    }
    if (!hadError) {
      toast.add({
        title: files.length > 1 ? "Files uploaded" : "File uploaded",
        type: "success",
      })
    }
    await loadFiles()
    setUploadQueue([])
  }

  async function onCropConfirm(crop, output) {
    if (!cropItem) return
    setCropSubmitting(true)
    try {
      const next = await waitForOptimize(cropItem.id, { crop, output })
      setItems((prev) => prev.map((row) => (row.id === cropItem.id ? { ...row, ...next } : row)))
      toast.add({ title: "Image optimized", type: "success" })
      setCropItem(null)
    } catch (err) {
      toast.add({ title: getApiError(err) || err.message, type: "error" })
      await loadFiles()
    } finally {
      setCropSubmitting(false)
    }
  }

  const accept = "image/*,video/*"
  const foldersEmpty = !inFolder && tree.length === 0
  const fileFiltered = Boolean(q.trim()) || mediaFilter !== "all"
  const filesEmpty = inFolder && !loading && items.length === 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-medium tracking-tight">Media</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {inFolder
              ? "Upload images and videos to this folder."
              : "Create a folder, then open it to upload images and videos."}
          </p>
        </div>
        {!inFolder ? (
          <Button type="button" onClick={openCreateFolder}>
            <FolderPlusIcon />
            New folder
          </Button>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={view} onValueChange={setView}>
              <TabsList variant="line">
                <TabsTrigger value="grid">
                  <LayoutGridIcon />
                  Grid
                </TabsTrigger>
                <TabsTrigger value="table">
                  <TableIcon />
                  Table
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
              <UploadIcon />
              Upload media
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="sr-only"
              accept={accept}
              multiple
              disabled={uploading}
              onChange={(event) => {
                const files = Array.from(event.target.files || [])
                event.target.value = ""
                if (files.length) void onFiles(files)
              }}
            />
          </div>
        )}
      </div>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            {folderId ? (
              <BreadcrumbLink href="#" onClick={(event) => { event.preventDefault(); setFolder("") }}>
                Media
              </BreadcrumbLink>
            ) : (
              <BreadcrumbPage>Media</BreadcrumbPage>
            )}
          </BreadcrumbItem>
          {current ? (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{current.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : null}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {!inFolder ? (
            <Input
              className="w-56"
              value={folderQ}
              onChange={(event) => setFolderQ(event.target.value)}
              placeholder="Search folder name"
              aria-label="Search folders"
            />
          ) : (
            <>
              <Input
                className="w-56"
                value={q}
                onChange={(event) => {
                  setPage(1)
                  setQ(event.target.value)
                }}
                placeholder="Search filename"
                aria-label="Search files"
              />
              <Select value={mediaFilter} onValueChange={setMediaFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue>
                    {mediaFilter === "raw"
                      ? "Raw image"
                      : mediaFilter === "optimized"
                        ? "Optimized image"
                        : mediaFilter === "video"
                          ? "Videos"
                          : "All"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="raw">Raw image</SelectItem>
                  <SelectItem value="optimized">Optimized image</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {!inFolder && foldersEmpty ? (
          <Empty className="border">
            <EmptyHeader>
              <EmptyTitle>{folderFiltered ? "No folders match" : "No folders yet"}</EmptyTitle>
              <EmptyDescription>
                {folderFiltered
                  ? "Try a different folder name."
                  : "Create a folder, then open it to upload media."}
              </EmptyDescription>
            </EmptyHeader>
            {folderFiltered ? null : (
              <EmptyContent>
                <Button type="button" onClick={openCreateFolder}>
                  <FolderPlusIcon />
                  New folder
                </Button>
              </EmptyContent>
            )}
          </Empty>
        ) : null}

        {!inFolder && tree.length ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {paginatedFolders.map((folder) => (
                <FolderCard
                  key={folder.id}
                  folder={folder}
                  onOpen={() => setFolder(folder.id)}
                  onEdit={() => openEditFolder(folder)}
                  onDelete={() => setDeleteTarget({ type: "folder", id: folder.id, name: folder.name })}
                />
              ))}
            </div>
            <ListPagination
              page={folderPage}
              limit={FOLDER_LIMIT}
              total={tree.length}
              onPageChange={setFolderPage}
            />
          </>
        ) : null}

        {inFolder ? (
          <>
            <UploadProgressList items={uploadQueue} />
            {loading || items.length ? (
              view === "table" ? (
                <MediaFilesTable
                  items={items}
                  loading={loading}
                  onOptimize={setCropItem}
                  onRename={(file) => { setRenameError(""); setRenameItem(file) }}
                  onDelete={(file) => setDeleteTarget({ type: "file", id: file.id, name: file.filename })}
                />
              ) : (
                <MediaGrid
                  items={items}
                  loading={loading}
                  onOptimize={setCropItem}
                  onRename={(file) => { setRenameError(""); setRenameItem(file) }}
                  onDelete={(file) => setDeleteTarget({ type: "file", id: file.id, name: file.filename })}
                />
              )
            ) : filesEmpty ? (
              <Empty className="border">
                <EmptyHeader>
                  <EmptyTitle>{fileFiltered ? "Oops, no files found" : "No files yet"}</EmptyTitle>
                  <EmptyDescription>
                    {fileFiltered
                      ? "Try a different filename or filter, or upload new media."
                      : "Upload images or videos to this folder."}
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <Button type="button" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    <UploadIcon />
                    Upload media
                  </Button>
                </EmptyContent>
              </Empty>
            ) : null}
            {!loading && items.length ? (
              <ListPagination page={page} limit={LIMIT} total={total} onPageChange={setPage} />
            ) : null}
          </>
        ) : null}
      </div>

      <FolderFormDialog
        open={folderOpen}
        onOpenChange={setFolderOpen}
        folder={editingFolder}
        onSubmit={onFolderSubmit}
        submitting={folderSubmitting}
        error={folderError}
      />

      <FilenameFormDialog
        open={Boolean(renameItem)}
        onOpenChange={(open) => { if (!open) { setRenameItem(null); setRenameError("") } }}
        item={renameItem}
        onSubmit={onRenameSubmit}
        submitting={renameSubmitting}
        error={renameError}
      />

      <MediaCropDialog
        open={Boolean(cropItem)}
        onOpenChange={(open) => { if (!open) setCropItem(null) }}
        item={cropItem}
        onConfirm={onCropConfirm}
        submitting={cropSubmitting}
      />

      <AlertDialog open={Boolean(deleteTarget)} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.type === "folder" ? "Delete folder?" : "Delete file?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.type === "folder"
                ? `Are you sure you want to delete "${deleteTarget.name}"? The folder must be empty.`
                : `Are you sure you want to delete "${deleteTarget?.name}"? This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function FolderCard({ folder, onOpen, onEdit, onDelete }) {
  return (
    <div className="relative flex cursor-pointer flex-col rounded-2xl border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40">
      <button
        type="button"
        className="flex min-w-0 flex-1 cursor-pointer flex-col items-start gap-2 text-left"
        onClick={onOpen}
      >
        <img src={OPEN_FOLDER_IMAGE_URL} alt="" className="size-10 object-contain" />
        <span className="truncate font-medium">{folder.name}</span>
        <span className="text-xs text-muted-foreground">Click to enter folder</span>
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="absolute top-2 right-2 cursor-pointer"
              onClick={(event) => event.stopPropagation()}
            />
          }
        >
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <PencilIcon />
            Edit name
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onClick={onDelete}>
            <Trash2Icon />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
