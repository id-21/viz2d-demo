import { getBucket, GCS_PATHS } from '../lib/gcs.js'
import { v4 as uuidv4 } from 'uuid'

const SIGNED_URL_EXPIRY_MINUTES = 15

interface SignedUploadUrlResult {
  uploadUrl: string
  gcsPath: string
  publicUrl: string
}

interface SignedDownloadUrlResult {
  downloadUrl: string
}

/**
 * Generate a signed URL for uploading an image directly to GCS
 */
export async function generateImageUploadUrl(
  imageId: string,
  filename: string,
  contentType: string
): Promise<SignedUploadUrlResult> {
  const bucket = getBucket()
  const gcsPath = GCS_PATHS.images(imageId, filename)
  const file = bucket.file(gcsPath)

  const [uploadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
    contentType,
  })

  // Public URL (requires bucket to be public or use signed URL for reading)
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsPath}`

  return {
    uploadUrl,
    gcsPath,
    publicUrl,
  }
}

/**
 * Generate a signed URL for downloading a file from GCS
 */
export async function generateDownloadUrl(gcsPath: string): Promise<SignedDownloadUrlResult> {
  const bucket = getBucket()
  const file = bucket.file(gcsPath)

  const [downloadUrl] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: Date.now() + SIGNED_URL_EXPIRY_MINUTES * 60 * 1000,
  })

  return { downloadUrl }
}

/**
 * Verify that a file exists in GCS
 */
export async function verifyFileExists(gcsPath: string): Promise<boolean> {
  const bucket = getBucket()
  const file = bucket.file(gcsPath)
  const [exists] = await file.exists()
  return exists
}

/**
 * Get file metadata from GCS
 */
export async function getFileMetadata(gcsPath: string): Promise<{ size: number; contentType: string }> {
  const bucket = getBucket()
  const file = bucket.file(gcsPath)
  const [metadata] = await file.getMetadata()

  return {
    size: Number(metadata.size) || 0,
    contentType: metadata.contentType || 'application/octet-stream',
  }
}

/**
 * Upload a buffer to GCS
 */
export async function uploadBuffer(
  gcsPath: string,
  buffer: Buffer,
  contentType: string
): Promise<{ gcsUrl: string }> {
  const bucket = getBucket()
  const file = bucket.file(gcsPath)

  await file.save(buffer, {
    contentType,
    resumable: false,
  })

  const gcsUrl = `https://storage.googleapis.com/${bucket.name}/${gcsPath}`

  return { gcsUrl }
}

/**
 * Generate a unique filename with extension
 */
export function generateUniqueFilename(originalName: string): string {
  const ext = originalName.split('.').pop() || ''
  return `${uuidv4()}.${ext}`
}
