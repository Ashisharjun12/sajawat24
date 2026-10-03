import {
  completeProfileAvatar,
  presignProfileAvatar,
  uploadImageFile,
} from '@/api/vendor.api';

function inferContentType(uri: string): 'image/jpeg' | 'image/png' | 'image/webp' {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  return 'image/jpeg';
}

function fileNameForUri(uri: string) {
  const parts = uri.split('/');
  const last = parts[parts.length - 1];
  return last && last.includes('.') ? last : 'avatar.jpg';
}

export async function uploadProfileAvatar(localUri: string) {
  const contentType = inferContentType(localUri);
  const presign = await presignProfileAvatar({
    fileName: fileNameForUri(localUri),
    contentType,
  });
  await uploadImageFile(presign.uploadUrl, localUri, contentType);
  await completeProfileAvatar(presign.uploadId);
  return presign.uploadId;
}
