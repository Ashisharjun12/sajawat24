import { api, unwrap } from "@/api/api";

export function presignUpload(body) {
  return api.post("/admin/uploads/presign", body).then(unwrap);
}

export function completeUpload(id) {
  return api.post(`/admin/uploads/${id}/complete`).then(unwrap);
}

export function optimizeUpload(id, { crop, output } = {}) {
  const body = {};
  if (crop) body.crop = crop;
  if (output) body.output = output;
  return api.post(`/admin/uploads/${id}/optimize`, body).then(unwrap);
}

export function getUpload(id) {
  return api.get(`/admin/uploads/${id}`).then(unwrap);
}

export function listUploads({ page = 1, limit = 24, q, kind, folderId, status, optimizeStatus } = {}) {
  return api
    .get("/admin/uploads", {
      params: {
        page,
        limit,
        ...(q ? { q } : {}),
        ...(kind ? { kind } : {}),
        ...(folderId === null ? { folderId: "null" } : folderId ? { folderId } : {}),
        ...(status ? { status } : {}),
        ...(optimizeStatus ? { optimizeStatus } : {}),
      },
    })
    .then(unwrap);
}

export function patchUpload(id, body) {
  return api.patch(`/admin/uploads/${id}`, body).then(unwrap);
}

export function deleteUpload(id) {
  return api.delete(`/admin/uploads/${id}`).then(unwrap);
}

export function mediaDisplayUrl(item) {
  return item?.publicUrl || "";
}

export function ingestUpload(file, { folderId, crop, filename } = {}) {
  const form = new FormData();
  form.append("file", file);
  if (folderId) form.append("folderId", folderId);
  if (filename) form.append("filename", filename);
  if (crop) form.append("crop", JSON.stringify(crop));
  return api
    .post("/admin/uploads/ingest", form, {
      headers: { "Content-Type": "multipart/form-data" },
    })
    .then(unwrap);
}

function putWithProgress(url, file, mimeType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", mimeType);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error("Failed to upload file to storage"));
    };
    xhr.onerror = () => reject(new Error("Failed to upload file to storage"));
    xhr.send(file);
  });
}

export async function uploadMediaFile(file, { folderId, onProgress } = {}) {
  const mimeType = file.type || "image/jpeg";
  const kind = mimeType.startsWith("video/") ? "video" : "image";

  const signed = await presignUpload({
    filename: file.name,
    mimeType,
    kind,
    optimize: false,
    ...(folderId ? { folderId } : {}),
  });

  if (signed.uploadMode === "ingest" || !signed.uploadUrl) {
    throw new Error("Direct upload URL missing from presign response");
  }

  await putWithProgress(signed.uploadUrl, file, mimeType, onProgress);
  return completeUpload(signed.id);
}

export async function pollOptimize(id, { timeoutMs = 30000 } = {}) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const row = await getUpload(id);
    if (row.optimizeStatus === "completed") return row;
    if (row.optimizeStatus === "failed") {
      throw new Error("Image optimize failed");
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  return getUpload(id);
}

export async function waitForOptimize(id, { crop, output, timeoutMs = 30000 } = {}) {
  await optimizeUpload(id, { crop, output });
  return pollOptimize(id, { timeoutMs });
}
