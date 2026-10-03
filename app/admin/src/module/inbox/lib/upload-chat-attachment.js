import { completeChatAttachment, presignChatAttachment } from "@/api/chat-attachments.api"

function guessKind(file) {
  if (file.type.startsWith("image/")) return "image"
  return "file"
}

async function putFile(uploadUrl, file) {
  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  })
  if (!uploadResponse.ok) {
    throw new Error("Failed to upload attachment")
  }
}

export async function uploadChatAttachment(conversationId, file) {
  const kind = guessKind(file)
  const mimeType = file.type || (kind === "image" ? "image/jpeg" : "application/pdf")
  const presign = await presignChatAttachment(conversationId, {
    fileName: file.name,
    mimeType,
    kind,
  })

  await putFile(presign.uploadUrl, file)
  await completeChatAttachment(conversationId, presign.uploadId)
  return {
    uploadId: presign.uploadId,
    messageType: kind,
  }
}
